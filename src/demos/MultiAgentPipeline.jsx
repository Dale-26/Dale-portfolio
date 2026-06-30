import { useState } from 'react'
import { callClaude } from '../lib/claude'
import { PIPELINE_PROMPTS } from '../lib/prompts'
import ErrorMessage from '../components/ErrorMessage'

const AGENTS = [
  { key: 'writer', name: 'Writer', icon: '✏️', blurb: 'Drafts the first version' },
  { key: 'reviewer', name: 'Reviewer', icon: '🔍', blurb: 'Critiques & improves it' },
  { key: 'publisher', name: 'Publisher', icon: '🚀', blurb: 'Polishes for publishing' },
]

const initialSteps = () =>
  AGENTS.map((a) => ({ ...a, status: 'idle', output: '' }))

export default function MultiAgentPipeline() {
  const [topic, setTopic] = useState('')
  const [steps, setSteps] = useState(initialSteps)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  function update(key, patch) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }

  async function run(e) {
    e.preventDefault()
    if (!topic.trim() || running) return
    setError('')
    setRunning(true)
    setSteps(initialSteps())

    try {
      // Writer
      update('writer', { status: 'running' })
      const draft = await callClaude({
        system: PIPELINE_PROMPTS.writer,
        messages: [{ role: 'user', content: `Topic: ${topic}` }],
      })
      update('writer', { status: 'done', output: draft })

      // Reviewer (receives the draft)
      update('reviewer', { status: 'running' })
      const reviewed = await callClaude({
        system: PIPELINE_PROMPTS.reviewer,
        messages: [{ role: 'user', content: `Draft to review:\n\n${draft}` }],
      })
      update('reviewer', { status: 'done', output: reviewed })

      // Publisher (receives the revised draft)
      update('publisher', { status: 'running' })
      const published = await callClaude({
        system: PIPELINE_PROMPTS.publisher,
        messages: [{ role: 'user', content: `Revised draft to publish:\n\n${reviewed}` }],
      })
      update('publisher', { status: 'done', output: published })
    } catch (err) {
      setError(err.message)
      setSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'idle' } : s)),
      )
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Enter a topic and watch three Gemini agents hand work off to each other,
        one after another.
      </p>

      <form onSubmit={run} className="flex flex-wrap gap-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Why small businesses should adopt AI"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={running || !topic.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run pipeline'}
        </button>
      </form>

      <ErrorMessage message={error} />

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.key} className="relative">
            {i < steps.length - 1 && (
              <span className="absolute left-5 top-12 h-[calc(100%-1rem)] w-px bg-slate-200" />
            )}
            <div
              className={`rounded-xl border p-4 transition-colors ${
                s.status === 'running'
                  ? 'border-accent bg-accent-light/40'
                  : s.status === 'done'
                    ? 'border-slate-200 bg-white'
                    : 'border-dashed border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                  {s.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.blurb}</p>
                </div>
                <span className="ml-auto text-xs font-medium">
                  {s.status === 'running' && <span className="text-accent">working…</span>}
                  {s.status === 'done' && <span className="text-green-600">✓ done</span>}
                  {s.status === 'idle' && <span className="text-slate-400">waiting</span>}
                </span>
              </div>
              {s.output && (
                <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-700 animate-fade-in-up">
                  {s.output}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
