import { useState } from 'react'
import { callClaudeJSON } from '../lib/claude'
import { LEAD_TRIAGE_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const SAMPLE = `hey so we met briefly at the bangkok tech expo — im som from chiang mai textiles.
we're drowning in manual order entry and someone said you build ai automations?
we'd maybe have like 50-80k baht to spend this quarter if it actually works.
can we talk this week? my email is som@cmtextiles.co.th. kind of urgent tbh`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: { type: 'STRING' },
    priority: { type: 'STRING', enum: ['high', 'med', 'low'] },
    extracted: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        company: { type: 'STRING' },
        email: { type: 'STRING' },
        budget: { type: 'STRING' },
        summary: { type: 'STRING' },
      },
      required: ['name', 'company', 'email', 'budget', 'summary'],
    },
    draftReply: { type: 'STRING' },
    nextActions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['intent', 'priority', 'extracted', 'draftReply', 'nextActions'],
}

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700',
  med: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

export default function LeadTriage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [reply, setReply] = useState('')
  const [copied, setCopied] = useState(false)

  async function triage(e) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const r = await callClaudeJSON({
        system: LEAD_TRIAGE_PROMPT,
        messages: [{ role: 'user', content: text }],
        schema: SCHEMA,
      })
      setResult(r)
      setReply(r.draftReply || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function copyReply() {
    navigator.clipboard?.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const ex = result?.extracted || {}

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Paste a messy inbound lead message. The AI classifies it, extracts a
        structured record, drafts a reply, and proposes next actions — an
        end-to-end triage automation.
      </p>

      <form onSubmit={triage} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Paste an inbound email / DM / form message…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-accent"
          >
            Use sample lead
          </button>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Triage lead
          </button>
        </div>
      </form>

      {loading && <LoadingDots label="Triaging" />}
      <ErrorMessage message={error} />

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark">
              {result.intent}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
                PRIORITY_STYLE[result.priority] || PRIORITY_STYLE.low
              }`}
            >
              {result.priority} priority
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Extracted record */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Extracted record
              </h4>
              <dl className="space-y-1 text-sm">
                {[
                  ['Name', ex.name],
                  ['Company', ex.company],
                  ['Email', ex.email],
                  ['Budget', ex.budget],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-slate-500">{k}</dt>
                    <dd className="text-slate-800">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
              {ex.summary && <p className="mt-3 text-sm italic text-slate-600">“{ex.summary}”</p>}
            </div>

            {/* Next actions */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggested next actions
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {(result.nextActions || []).map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 accent-current text-accent" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Editable draft reply */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Drafted reply (editable)
              </h4>
              <button
                onClick={copyReply}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-accent hover:text-accent"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={7}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}
    </div>
  )
}
