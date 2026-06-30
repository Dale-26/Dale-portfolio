// Vercel Edge function — a real tool-using agent. It runs a function-calling
// loop with Gemini: the model decides which tool to call, this function executes
// the tool server-side, feeds the result back, and repeats until the model has a
// final answer. Each step is streamed to the browser as a line of NDJSON so the
// UI can show the agent's reasoning and tool calls live.
//
// Event shapes (one JSON object per line):
//   { type: 'tool_call',   name, args }
//   { type: 'tool_result', name, result }
//   { type: 'final',       text }
//   { type: 'error',       message }

export const config = { runtime: 'edge' }

const MODEL = 'gemini-2.5-flash'
const MAX_ITERATIONS = 5

const SYSTEM = `You are an autonomous assistant that solves the user's request by
calling the provided tools when helpful. Use tools for any math, customer lookup,
or product search rather than guessing. When you have enough information, give a
concise final answer. Today's context is a demo CRM/product environment.`

// --- Tool definitions (sent to Gemini) --------------------------------------
const TOOL_DECLARATIONS = [
  {
    name: 'calculate',
    description: 'Evaluate an arithmetic expression (+, -, *, /, %, parentheses) and return the number.',
    parameters: {
      type: 'OBJECT',
      properties: { expression: { type: 'STRING', description: 'e.g. "18% of 2450" written as "2450 * 0.18"' } },
      required: ['expression'],
    },
  },
  {
    name: 'lookupCustomer',
    description: 'Look up a customer record by name from the CRM.',
    parameters: {
      type: 'OBJECT',
      properties: { name: { type: 'STRING' } },
      required: ['name'],
    },
  },
  {
    name: 'searchProducts',
    description: 'Search the product catalogue by keyword. Returns matching products with prices.',
    parameters: {
      type: 'OBJECT',
      properties: { query: { type: 'STRING' } },
      required: ['query'],
    },
  },
]

// --- Mock data ---------------------------------------------------------------
const CUSTOMERS = {
  niran: { name: 'Niran Suksai', company: 'Bangkok Fresh Co.', plan: 'Premium', mrr: 4500, renewalWeeks: 6 },
  som: { name: 'Som Charoen', company: 'Chiang Mai Textiles', plan: 'Starter', mrr: 900, renewalWeeks: 2 },
  lek: { name: 'Lek Wong', company: 'Phuket Tours Ltd.', plan: 'Growth', mrr: 2200, renewalWeeks: 11 },
}

const PRODUCTS = [
  { sku: 'AUTO-START', name: 'Automation Starter', price: 900, tags: ['starter', 'automation'] },
  { sku: 'AUTO-GROWTH', name: 'Automation Growth', price: 2200, tags: ['growth', 'automation', 'crm'] },
  { sku: 'AUTO-PREM', name: 'Automation Premium', price: 4500, tags: ['premium', 'automation', 'crm', 'ai'] },
  { sku: 'AI-ADDON', name: 'AI Agent Add-on', price: 1200, tags: ['ai', 'agent', 'addon'] },
]

// --- Tool executors ----------------------------------------------------------
function runTool(name, args) {
  switch (name) {
    case 'calculate':
      return { value: safeCalc(String(args?.expression ?? '')) }
    case 'lookupCustomer': {
      const key = String(args?.name ?? '').toLowerCase().split(/\s+/)[0]
      const rec = CUSTOMERS[key]
      return rec || { error: `No customer found matching "${args?.name}".` }
    }
    case 'searchProducts': {
      const q = String(args?.query ?? '').toLowerCase()
      const matches = PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)),
      )
      return { matches: matches.length ? matches : PRODUCTS }
    }
    default:
      return { error: `Unknown tool "${name}".` }
  }
}

// Safe arithmetic evaluator (shunting-yard). No eval, no identifiers.
function safeCalc(expr) {
  const tokens = expr.match(/\d+\.?\d*|[+\-*/%()]/g)
  if (!tokens) throw new Error('Empty expression')
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 }
  const out = []
  const ops = []
  const apply = (op) => {
    const b = out.pop()
    const a = out.pop()
    if (a === undefined || b === undefined) throw new Error('Bad expression')
    if (op === '+') out.push(a + b)
    else if (op === '-') out.push(a - b)
    else if (op === '*') out.push(a * b)
    else if (op === '/') out.push(a / b)
    else if (op === '%') out.push(a % b)
  }
  for (const t of tokens) {
    if (/^\d/.test(t)) out.push(parseFloat(t))
    else if (t === '(') ops.push(t)
    else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply(ops.pop())
      ops.pop()
    } else {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) apply(ops.pop())
      ops.push(t)
    }
  }
  while (ops.length) apply(ops.pop())
  const result = out.pop()
  if (out.length || result === undefined || !isFinite(result)) throw new Error('Bad expression')
  return result
}

// --- Gemini call -------------------------------------------------------------
async function generate(apiKey, contents) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        system_instruction: { parts: [{ text: SYSTEM }] },
      }),
    },
  )
  const j = await r.json()
  if (!r.ok) {
    throw new Error(j?.error?.message || `Gemini API returned status ${r.status}.`)
  }
  return j
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed.', { status: 405 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response('Server is missing GEMINI_API_KEY.', { status: 500 })

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body.', { status: 400 })
  }
  const userMessage = body?.message
  if (!userMessage || typeof userMessage !== 'string') {
    return new Response('Request must include a "message" string.', { status: 400 })
  }

  const encoder = new TextEncoder()
  const send = (controller, obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))

  const stream = new ReadableStream({
    async start(controller) {
      const contents = [{ role: 'user', parts: [{ text: userMessage }] }]
      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const res = await generate(apiKey, contents)
          const content = res?.candidates?.[0]?.content
          const parts = content?.parts || []
          const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall)

          if (calls.length === 0) {
            const text = parts.map((p) => p.text || '').join('').trim()
            send(controller, { type: 'final', text: text || '(no answer)' })
            controller.close()
            return
          }

          // Record the model's tool-calling turn, then execute each call.
          contents.push(content)
          const responseParts = []
          for (const call of calls) {
            send(controller, { type: 'tool_call', name: call.name, args: call.args || {} })
            let result
            try {
              result = runTool(call.name, call.args || {})
            } catch (err) {
              result = { error: err.message }
            }
            send(controller, { type: 'tool_result', name: call.name, result })
            responseParts.push({ functionResponse: { name: call.name, response: result } })
          }
          contents.push({ role: 'user', parts: responseParts })
        }
        send(controller, { type: 'final', text: 'Reached the step limit before finishing. Try a simpler request.' })
        controller.close()
      } catch (err) {
        send(controller, { type: 'error', message: err.message })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
