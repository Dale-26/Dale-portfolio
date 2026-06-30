// Vercel serverless function — fetches a public web page server-side and returns
// its title, meta description, and extracted plain text. Doing the fetch on the
// server avoids browser CORS limits. The AI analysis itself runs via the normal
// /api/claude structured-output path on the client.
//
// SSRF guard: only http/https, and obvious local/private hosts are rejected.
// (A demo-grade guard — not a substitute for a hardened egress proxy.)

const BLOCKED_HOST = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|::1|\[?::1)|172\.(1[6-9]|2\d|3[01])\./i

function isSafeUrl(raw) {
  let u
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  if (BLOCKED_HOST.test(u.hostname)) return false
  return true
}

function extract(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
    ''
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const wordCount = text ? text.split(/\s+/).length : 0
  return { title, description, h1s, wordCount, text: text.slice(0, 6000) }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  const { url } = req.body || {}
  if (!url || typeof url !== 'string' || !isSafeUrl(url)) {
    res.status(400).json({ error: 'Please provide a valid public http(s) URL.' })
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DalePortfolioBot/1.0)' },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    const type = r.headers.get('content-type') || ''
    if (!r.ok) {
      res.status(502).json({ error: `The page returned status ${r.status}.` })
      return
    }
    if (!type.includes('text/html') && !type.includes('text/plain')) {
      res.status(415).json({ error: 'That URL is not an HTML page.' })
      return
    }

    const html = (await r.text()).slice(0, 400_000) // cap to ~400KB
    const data = extract(html)
    if (!data.text) {
      res.status(422).json({ error: 'Could not extract readable text from that page.' })
      return
    }
    res.status(200).json({ url, ...data })
  } catch (err) {
    clearTimeout(timeout)
    const msg = err.name === 'AbortError' ? 'The page took too long to respond.' : `Could not fetch that page: ${err.message}`
    res.status(502).json({ error: msg })
  }
}
