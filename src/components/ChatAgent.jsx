import { useState, useRef, useEffect } from 'react'
import { streamClaude } from '../lib/claude'
import { PORTFOLIO_SYSTEM_PROMPT } from '../lib/prompts'
import LoadingDots from './LoadingDots'
import ErrorMessage from './ErrorMessage'

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm Dale's AI assistant. Ask me anything about his skills, projects, or experience with AI automation. 👋",
}

const SUGGESTIONS = [
  'What can Dale build?',
  'Tell me about his projects',
  'Why hire Dale?',
]

export default function ChatAgent() {
  const [messages, setMessages] = useState([GREETING])
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
    const userMsg = { role: 'user', content }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      // Send only the real conversation turns (skip the local greeting bubble).
      const apiMessages = history
        .filter((m) => m !== GREETING)
        .map((m) => ({ role: m.role, content: m.content }))

      // Stream the reply: append an assistant bubble on the first token,
      // then grow its content as deltas arrive.
      let started = false
      await streamClaude({
        system: PORTFOLIO_SYSTEM_PROMPT,
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
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:h-[32rem]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-slate-700">Dale&apos;s AI Assistant</span>
        <span className="ml-auto text-xs text-slate-400">powered by Gemini</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed animate-fade-in-up ${
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
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
              <LoadingDots />
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-accent hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        {error && (
          <div className="mb-2">
            <ErrorMessage message={error} />
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Dale's experience…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
