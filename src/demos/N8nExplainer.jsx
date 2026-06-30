import { useState, useRef, useEffect } from 'react'
import { callClaude } from '../lib/claude'
import { N8N_EXPLAINER_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const NODES = [
  { label: 'Webhook', icon: '📥' },
  { label: 'Filter', icon: '🔀' },
  { label: 'Gemini AI', icon: '🤖' },
  { label: 'Sheets', icon: '📊' },
  { label: 'Gmail', icon: '✉️' },
]

const QUICK = [
  'What does the Filter node do?',
  'Explain the whole workflow',
  'Why use the AI node here?',
]

export default function N8nExplainer() {
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
      const reply = await callClaude({
        system: N8N_EXPLAINER_PROMPT,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        A sample n8n automation: it captures form leads, drafts an AI reply, logs
        it, and emails the lead. Ask the assistant what any node does.
      </p>

      {/* Workflow diagram */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex min-w-max items-center gap-2">
          {NODES.map((n, i) => (
            <div key={n.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-300 bg-white text-2xl shadow-sm">
                  {n.icon}
                </div>
                <span className="text-xs font-medium text-slate-600">{n.label}</span>
              </div>
              {i < NODES.length - 1 && <span className="text-slate-400">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="max-h-56 space-y-3 overflow-y-auto">
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
        {loading && <LoadingDots label="Explaining" />}
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
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

      {error && <ErrorMessage message={error} />}

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
          placeholder="Ask about a node…"
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
  )
}
