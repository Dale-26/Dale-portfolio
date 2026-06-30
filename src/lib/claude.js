// Shared client helper. Every component talks to the model through this single
// function, which POSTs to our own /api/claude serverless proxy (backed by the
// Gemini API). The API key lives only on the server — it is never bundled into
// the browser.

const ENDPOINT = '/api/claude'

/**
 * Send a conversation to Claude and return the assistant's text reply.
 *
 * @param {Object}   opts
 * @param {string=}  opts.system     System prompt.
 * @param {Array}    opts.messages   [{ role: 'user'|'assistant', content: string }]
 * @param {number=}  opts.maxTokens  Max tokens to generate (default 1024).
 * @returns {Promise<string>} The assistant's reply text.
 */
export async function callClaude({ system, messages, maxTokens = 1024 }) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
    })
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.')
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (status ${res.status}).`)
  }

  const text = data?.content?.map((block) => block.text || '').join('').trim()
  if (!text) {
    throw new Error('The model returned an empty response. Please try again.')
  }
  return text
}
