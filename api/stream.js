// Vercel Edge function — streams a Gemini reply token-by-token to the browser.
// Reads Gemini's SSE (:streamGenerateContent?alt=sse) and re-emits just the
// text deltas as a plain UTF-8 stream, so the client can append them live.
// The API key stays server-side (GEMINI_API_KEY); it is never sent to the browser.

export const config = { runtime: 'edge' }

const MODEL = 'gemini-2.5-flash'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed. Use POST.', { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(
      'Server is missing GEMINI_API_KEY. Add it to your .env file (local) or Vercel project settings (deployed).',
      { status: 500 },
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body.', { status: 400 })
  }

  const { system, messages, max_tokens } = body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Request must include a non-empty "messages" array.', { status: 400 })
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: max_tokens || 1024 },
        ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
      }),
    },
  )

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '')
    let msg = `Gemini API returned status ${upstream.status}.`
    try {
      msg = JSON.parse(errText)?.error?.message || msg
    } catch {
      /* keep default */
    }
    return new Response(msg, { status: upstream.status })
  }

  // Transform Gemini SSE -> plain text deltas.
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = upstream.body.getReader()
  let buffer = ''

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      buffer += decoder.decode(value, { stream: true })
      // SSE events are separated by blank lines; each "data:" line holds JSON.
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const json = JSON.parse(payload)
          const text =
            json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
          if (text) controller.enqueue(encoder.encode(text))
        } catch {
          /* ignore partial/non-JSON keep-alive lines */
        }
      }
    },
    cancel() {
      reader.cancel()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
