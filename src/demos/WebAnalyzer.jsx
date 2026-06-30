import { useState } from 'react'
import { fetchPage, callClaudeJSON } from '../lib/claude'
import { WEB_ANALYZER_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const SAMPLE = 'https://en.wikipedia.org/wiki/Workflow_automation'

const MODES = [
  { id: 'SEO', label: 'SEO' },
  { id: 'Readability', label: 'Readability' },
  { id: 'Tone & Brand', label: 'Tone & Brand' },
  { id: 'Accessibility', label: 'Accessibility' },
]

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    audience: { type: 'STRING' },
    tone: { type: 'STRING' },
    readability: { type: 'STRING' },
    seo: {
      type: 'OBJECT',
      properties: {
        score: { type: 'NUMBER' },
        findings: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['score', 'findings'],
    },
    keywords: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestedKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
    meta: {
      type: 'OBJECT',
      properties: { title: { type: 'STRING' }, description: { type: 'STRING' } },
      required: ['title', 'description'],
    },
    keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
    improvements: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['summary', 'audience', 'tone', 'readability', 'seo', 'keywords', 'suggestedKeywords', 'meta', 'keyPoints', 'improvements'],
}

function scoreColor(s) {
  if (s >= 75) return 'text-green-600'
  if (s >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export default function WebAnalyzer() {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState('SEO')
  const [status, setStatus] = useState('') // 'fetching' | 'analysing' | ''
  const [error, setError] = useState('')
  const [page, setPage] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [copied, setCopied] = useState('')

  function copy(key, value) {
    navigator.clipboard?.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  async function analyze(e) {
    e.preventDefault()
    if (!url.trim() || status) return
    setError('')
    setPage(null)
    setAnalysis(null)
    try {
      setStatus('fetching')
      const fetched = await fetchPage(url.trim())
      setPage(fetched)

      setStatus('analysing')
      const content = `FOCUS: ${mode}

URL: ${fetched.url}
Title: ${fetched.title}
Meta description: ${fetched.description || '(none)'}
H1 headings: ${fetched.h1s?.join(' | ') || '(none)'}
Word count: ${fetched.wordCount}

Extracted text:
${fetched.text}`
      const result = await callClaudeJSON({
        system: WEB_ANALYZER_PROMPT,
        messages: [{ role: 'user', content }],
        schema: SCHEMA,
      })
      setAnalysis(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setStatus('')
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Paste any public page URL. The server fetches it, then AI analyses its
        content, tone, readability, and SEO — and suggests improvements.
      </p>

      <form onSubmit={analyze} className="space-y-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                mode === m.id
                  ? 'bg-accent text-white'
                  : 'border border-slate-300 text-slate-600 hover:border-accent'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUrl(SAMPLE)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-accent"
          >
            Use sample URL
          </button>
          <button
            type="submit"
            disabled={!!status || !url.trim()}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Analyze
          </button>
        </div>
      </form>

      {status === 'fetching' && <LoadingDots label="Fetching page" />}
      {status === 'analysing' && <LoadingDots label="Analysing content" />}
      <ErrorMessage message={error} />

      {page && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-800">{page.title || page.url}</p>
          <p className="text-xs text-slate-500">
            {page.wordCount.toLocaleString()} words analysed
          </p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3 text-center">
              <p className={`text-2xl font-bold ${scoreColor(analysis.seo?.score ?? 0)}`}>
                {Math.round(analysis.seo?.score ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500">SEO score / 100</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Tone</p>
              <p className="text-sm font-medium text-slate-800">{analysis.tone}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Readability</p>
              <p className="text-sm font-medium text-slate-800">{analysis.readability}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Summary</h4>
            <p className="text-sm text-slate-700">{analysis.summary}</p>
            <p className="mt-2 text-xs text-slate-500">Audience: {analysis.audience}</p>
          </div>

          {/* Suggested meta */}
          {analysis.meta && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggested meta tags
              </h4>
              <div className="space-y-2">
                {[
                  ['title', 'Title', analysis.meta.title],
                  ['desc', 'Description', analysis.meta.description],
                ].map(([key, label, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="w-20 flex-shrink-0 text-xs text-slate-400">{label}</span>
                    <p className="flex-1 text-sm text-slate-700">{value}</p>
                    <button
                      onClick={() => copy(key, value)}
                      className="flex-shrink-0 rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:border-accent hover:text-accent"
                    >
                      {copied === key ? '✓' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {(analysis.keywords?.length > 0 || analysis.suggestedKeywords?.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Chips title="Detected keywords" items={analysis.keywords} />
              <Chips title="Suggested keywords" items={analysis.suggestedKeywords} accent />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="SEO findings" items={analysis.seo?.findings} />
            <Section title="Key points" items={analysis.keyPoints} />
          </div>
          <Section title="Suggested improvements" items={analysis.improvements} accent />
        </div>
      )}
    </div>
  )
}

function Chips({ title, items, accent }) {
  if (!items?.length) return null
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((k, i) => (
          <span
            key={i}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              accent ? 'bg-accent-light text-accent-dark' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  )
}

function Section({ title, items, accent }) {
  if (!items?.length) return null
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-accent/30 bg-accent-light/30' : 'border-slate-200'}`}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent">•</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}
