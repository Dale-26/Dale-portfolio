import { useState, useRef, useEffect } from 'react'
import { streamClaude } from '../lib/claude'
import { CRM_ASSISTANT_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const CUSTOMER = {
  name: 'Niran Suksai',
  company: 'Bangkok Fresh Co.',
  status: 'Active · Premium plan',
  history: [
    'Signed up 8 months ago on the Premium plan.',
    'Logged 2 support tickets about API rate limits (both resolved).',
    'Last contact: 3 weeks ago — asked about adding 2 team seats.',
    'Renewal due in 6 weeks.',
  ],
}

const RECORD_CONTEXT = `Customer record:
Name: ${CUSTOMER.name}
Company: ${CUSTOMER.company}
Status: ${CUSTOMER.status}
History:
${CUSTOMER.history.map((h) => `- ${h}`).join('\n')}`

const QUICK = [
  'Draft a renewal follow-up email',
  'Summarise this customer',
  'Suggest next actions',
]

export default function CrmAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

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
          ? { role: 'user', content: `${RECORD_CONTEXT}\n\nRequest: ${m.content}` }
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

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="md:col-span-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-900">{CUSTOMER.name}</h4>
          <p className="text-xs text-slate-500">{CUSTOMER.company}</p>
          <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            {CUSTOMER.status}
          </span>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
            {CUSTOMER.history.map((h, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-accent">•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="md:col-span-3">
        <div ref={scrollRef} className="mb-3 max-h-64 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">
              Ask the AI to help with this customer. Try a quick action below.
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

        {messages.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-accent hover:text-accent"
              >
                {q}
              </button>
            ))}
          </div>
        )}

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
