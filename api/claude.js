// Vercel serverless function — proxies requests to the Google Gemini API so the
// API key never reaches the browser. Configured via the GEMINI_API_KEY
// environment variable (set in `.env` locally and in Vercel project settings).
//
// The browser sends an Anthropic-style payload ({ system, messages, max_tokens });
// this function translates it to Gemini's format and translates the response back
// to { content: [{ text }] } so the client helper needs no changes.

const MODEL = 'gemini-2.5-flash'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({
      error:
        'Server is missing GEMINI_API_KEY. Add it to your .env file (local) or Vercel project settings (deployed).',
    })
    return
  }

  try {
    const { system, messages, max_tokens } = req.body || {}

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Request must include a non-empty "messages" array.' })
      return
    }

    // Translate Anthropic-style messages to Gemini "contents".
    // Gemini uses role "model" for the assistant; "user" stays the same.
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body = {
      contents,
      generationConfig: { maxOutputTokens: max_tokens || 1024 },
      ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      },
    )

    const data = await upstream.json()

    if (!upstream.ok) {
      const message =
        data?.error?.message || `Gemini API returned status ${upstream.status}.`
      res.status(upstream.status).json({ error: message })
      return
    }

    // Flatten Gemini's candidate parts into Anthropic-style content blocks.
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''

    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(500).json({ error: `Proxy error: ${err.message}` })
  }
}
