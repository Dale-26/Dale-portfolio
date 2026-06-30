import { useState, useRef, useEffect } from 'react'
import { streamClaude, callClaudeJSON } from '../lib/claude'
import { CRM_ASSISTANT_PROMPT, CRM_HEALTH_PROMPT } from '../lib/prompts'
import { customers } from '../data/customers'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const ACTIONS = [
  { label: 'Draft follow-up email', prompt: 'Draft a follow-up email for this customer with a subject line.' },
  { label: 'Summarise history', prompt: 'Summarise this customer in 3-4 bullet points.' },
  { label: 'Upsell / next action', prompt: 'Recommend the next best action or upsell for this customer, with reasoning.' },
]

const HEALTH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'NUMBER' },
    risk: { type: 'STRING', enum: ['low', 'med', 'high'] },
    sentiment: { type: 'STRING' },
    reasons: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['score', 'risk', 'sentiment', 'reasons'],
}

const RISK_STYLE = {
  low: 'bg-green-100 text-green-700',
  med: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

function recordContext(c) {
  return `Customer record:
Name: ${c.name}
Company: ${c.company}
Plan: ${c.plan} (${c.mrr.toLocaleString()} THB/mo)
Renewal: ${c.renewal}
History:
${c.history.map((h) => `- ${h}`).join('\n')}`
}

export default function CrmAssistant() {
  const [activeId, setActiveId] = useState(customers[0].id)
  const [notes, setNotes] = useState({}) // id -> extra history lines added this session
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const scrollRef = useRef(null)

  const base = customers.find((c) => c.id === activeId)
  const customer = { ...base, history: [...base.history, ...(notes[activeId] || [])] }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Switching customer resets the per-customer conversation + health.
  function switchTo(id) {
    if (id === activeId) return
    setActiveId(id)
    setMessages([])
    setHealth(null)
    setError('')
  }

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setError('')
    setInput('')
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setLoading(true)
    try {
      const apiMessages = history.map((m, i) =>
        i === 0
          ? { role: 'user', content: `${recordContext(customer)}\n\nRequest: ${m.content}` }
          : { role: m.role, content: m.content },
      )
      let started = false
      await streamClaude({
        system: CRM_ASSISTANT_PROMPT,
        messages: apiMessages,
        onChunk: (delta) => {
          setMessages((prev) => {
            if (!started) {
              started = true
              return [...prev, { role: 'assistant', content: delta }]
            }
            const copy = prev.slice()
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = { ...last, content: last.content + delta }
            return copy
          })
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeHealth() {
    if (healthLoading) return
    setError('')
    setHealthLoading(true)
    try {
      const result = await callClaudeJSON({
        system: CRM_HEALTH_PROMPT,
        messages: [{ role: 'user', content: recordContext(customer) }],
        schema: HEALTH_SCHEMA,
      })
      setHealth(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setHealthLoading(false)
    }
  }

  function addNote(e) {
    e.preventDefault()
    const note = noteInput.trim()
    if (!note) return
    setNotes((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), `📝 ${note}`] }))
    setNoteInput('')
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {/* Left: customer record */}
      <div className="space-y-3 md:col-span-2">
        {/* Customer switcher */}
        <div className="flex flex-wrap gap-1.5">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => switchTo(c.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                c.id === activeId
                  ? 'bg-accent text-white'
                  : 'border border-slate-300 text-slate-600 hover:border-accent'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-900">{customer.name}</h4>
          <p className="text-xs text-slate-500">{customer.company}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {customer.status}
            </span>
            <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              {customer.mrr.toLocaleString()} THB/mo
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
            {customer.history.map((h, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-accent">•</span>
                {h}
              </li>
            ))}
          </ul>

          {/* Add note */}
          <form onSubmit={addNote} className="mt-3 flex gap-1.5">
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Log an interaction…"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-accent"
            />
            <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-accent">
              Add
            </button>
          </form>
        </div>

        {/* Health panel */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account health
            </h4>
            <button
              onClick={analyzeHealth}
              disabled={healthLoading}
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {healthLoading ? 'Analyzing…' : health ? 'Re-analyze' : 'Analyze health'}
            </button>
          </div>
          {healthLoading && <div className="mt-2"><LoadingDots label="Scoring" /></div>}
          {health && !healthLoading && (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-slate-900">{Math.round(health.score)}</span>
                <span className="text-xs text-slate-400">/100</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${RISK_STYLE[health.risk] || RISK_STYLE.med}`}>
                  {health.risk} risk
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Sentiment: {health.sentiment}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {(health.reasons || []).map((r, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-accent">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right: chat + actions */}
      <div className="md:col-span-3">
        <div ref={scrollRef} className="mb-3 max-h-64 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">
              Pick a quick action, or ask anything about {customer.name.split(' ')[0]}.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-accent text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-800'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === 'user' && (
            <LoadingDots label="Drafting" />
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              disabled={loading}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-2"><ErrorMessage message={error} /></div>}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this customer…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
