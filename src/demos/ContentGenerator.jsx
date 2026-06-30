import { useState } from 'react'
import { callClaude } from '../lib/claude'
import { CONTENT_GENERATOR_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const TONES = ['professional', 'casual', 'marketing']

// Pull "ENGLISH:" and "THAI:" sections out of Claude's formatted reply.
function parse(text) {
  const en = text.match(/ENGLISH:\s*([\s\S]*?)(?:THAI:|$)/i)?.[1]?.trim() || ''
  const th = text.match(/THAI:\s*([\s\S]*)$/i)?.[1]?.trim() || ''
  return { en, th }
}

export default function ContentGenerator() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function generate(e) {
    e.preventDefault()
    if (!topic.trim() || loading) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const text = await callClaude({
        system: CONTENT_GENERATOR_PROMPT,
        messages: [
          { role: 'user', content: `Topic: ${topic}\nTone: ${tone}` },
        ],
      })
      setResult(parse(text))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Enter a topic and pick a tone. Gemini writes a matching post in English
        and Thai.
      </p>

      <form onSubmit={generate} className="space-y-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Launching our new AI chatbot"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600">Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize outline-none focus:border-accent"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </form>

      {loading && <LoadingDots label="Writing posts" />}
      <ErrorMessage message={error} />

      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
              English
            </h4>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{result.en}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
              ไทย (Thai)
            </h4>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{result.th}</p>
          </div>
        </div>
      )}
    </div>
  )
}
