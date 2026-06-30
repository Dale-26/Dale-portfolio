// Shared client helpers. Every component talks to the model through these
// functions, which POST to our own serverless proxies (backed by the Gemini
// API). The API key lives only on the server — never bundled into the browser.
//
//   callClaude     — one-shot text reply
//   streamClaude   — token-by-token streaming text
//   callClaudeJSON — schema-validated structured JSON

const ENDPOINT = '/api/claude'
const STREAM_ENDPOINT = '/api/stream'

/**
 * One-shot, non-streaming text reply.
 * @returns {Promise<string>}
 */
export async function callClaude({ system, messages, maxTokens = 1024 }) {
  const data = await postJSON(ENDPOINT, { system, messages, max_tokens: maxTokens })
  const text = data?.content?.map((block) => block.text || '').join('').trim()
  if (!text) {
    throw new Error('The model returned an empty response. Please try again.')
  }
  return text
}

/**
 * Schema-validated structured output. Returns parsed JSON.
 * @param {Object} opts
 * @param {Object} opts.schema  A Gemini-style responseSchema object.
 * @returns {Promise<any>}
 */
export async function callClaudeJSON({ system, messages, schema, maxTokens = 2048 }) {
  const data = await postJSON(ENDPOINT, {
    system,
    messages,
    max_tokens: maxTokens,
    response_schema: schema,
  })
  const raw = data?.content?.map((block) => block.text || '').join('').trim() || ''
  return parseJSONLoose(raw)
}

/**
 * Stream a text reply token-by-token.
 * @param {Object}   opts
 * @param {Function} opts.onChunk  Called with each incremental text delta.
 * @param {AbortSignal=} opts.signal  Abort to cancel the stream.
 * @returns {Promise<string>} The full accumulated text.
 */
export async function streamClaude({ system, messages, maxTokens = 1024, onChunk, signal }) {
  let res
  try {
    res = await fetch(STREAM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  if (!res.ok || !res.body) {
    // The stream endpoint emits a plain-text error body on failure.
    const msg = (await res.text().catch(() => '')) || `Request failed (status ${res.status}).`
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) {
      full += chunk
      onChunk?.(chunk)
    }
  }
  if (!full.trim()) {
    throw new Error('The model returned an empty response. Please try again.')
  }
  return full
}

/**
 * Run the tool-using agent. Streams NDJSON events from /api/agent.
 * @param {Object}   opts
 * @param {string}   opts.message  The user's request.
 * @param {Function} opts.onEvent  Called with each parsed event object
 *                                  ({type:'tool_call'|'tool_result'|'final'|'error', ...}).
 * @param {AbortSignal=} opts.signal
 */
export async function runAgent({ message, onEvent, signal }) {
  let res
  try {
    res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  if (!res.ok || !res.body) {
    const msg = (await res.text().catch(() => '')) || `Request failed (status ${res.status}).`
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        onEvent?.(JSON.parse(trimmed))
      } catch {
        /* ignore partial lines */
      }
    }
  }
}

// --- internals ---------------------------------------------------------------

async function postJSON(url, payload) {
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
  return data
}

// Tolerant JSON parse: handles models that wrap JSON in prose or code fences.
function parseJSONLoose(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
    const candidate = fenced ?? raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      throw new Error('The model returned malformed data. Please try again.')
    }
  }
}
