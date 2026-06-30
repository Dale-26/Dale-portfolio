import { useState, useRef, useEffect } from 'react'
import { runAgent } from '../lib/claude'
import ErrorMessage from '../components/ErrorMessage'
import LoadingDots from '../components/LoadingDots'

const SUGGESTIONS = [
  'What is 18% of 2,450, and look up customer Niran?',
  'Find AI products and total the price of the two cheapest.',
  "Look up Som's plan and tell me their yearly spend.",
]

const TOOL_ICON = { calculate: '🧮', lookupCustomer: '👤', searchProducts: '🔎' }

export default function AgentDemo() {
  const [input, setInput] = useState('')
  const [events, setEvents] = useState([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [events, running])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function run(text) {
    const message = (text ?? input).trim()
    if (!message || running) return
    setError('')
    setEvents([])
    setInput('')
    setRunning(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await runAgent({
        message,
        signal: controller.signal,
        onEvent: (ev) => {
          if (ev.type === 'error') setError(ev.message)
          else setEvents((prev) => [...prev, ev])
        },
      })
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const hasFinal = events.some((e) => e.type === 'final')

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        A real <span className="font-medium">tool-using agent</span>. It decides
        which tools to call (calculator, CRM lookup, product search), runs them,
        and reasons over the results. Watch each step stream in live.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something that needs a calculation or lookup…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={running || !input.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run agent'}
        </button>
      </form>

      {events.length === 0 && !running && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-accent hover:text-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <ErrorMessage message={error} />

      {(events.length > 0 || running) && (
        <div ref={scrollRef} className="max-h-80 space-y-2 overflow-y-auto">
          {events.map((ev, i) => {
            if (ev.type === 'tool_call') {
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-light/40 px-3 py-2 text-sm animate-fade-in-up"
                >
                  <span>{TOOL_ICON[ev.name] || '🔧'}</span>
                  <span className="font-medium text-accent-dark">{ev.name}</span>
                  <span className="truncate font-mono text-xs text-slate-500">
                    ({Object.entries(ev.args || {}).map(([k, v]) => `${k}: ${v}`).join(', ')})
                  </span>
                </div>
              )
            }
            if (ev.type === 'tool_result') {
              return (
                <div
                  key={i}
                  className="ml-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 animate-fade-in-up"
                >
                  → {JSON.stringify(ev.result)}
                </div>
              )
            }
            if (ev.type === 'final') {
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm animate-fade-in-up"
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                    Answer
                  </p>
                  <p className="whitespace-pre-wrap">{ev.text}</p>
                </div>
              )
            }
            return null
          })}
          {running && !hasFinal && (
            <div className="pl-1">
              <LoadingDots label="Agent thinking" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
