import { useState } from 'react'
import { callClaude } from '../lib/claude'
import { KPI_ANALYSER_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const SAMPLE = `Q1 revenue: 1.2M THB
Q2 revenue: 1.05M THB
Q3 revenue: 1.4M THB
New customers: Q1 120, Q2 95, Q3 160
Churn rate: 4% -> 6% -> 3%`

export default function KpiAnalyser() {
  const [data, setData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState('')

  async function analyse(e) {
    e.preventDefault()
    if (!data.trim() || loading) return
    setError('')
    setReport('')
    setLoading(true)
    try {
      const out = await callClaude({
        system: KPI_ANALYSER_PROMPT,
        messages: [{ role: 'user', content: data }],
      })
      setReport(out)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Paste raw numbers or a short data summary. Gemini returns key findings and
        recommendations in plain English.
      </p>

      <form onSubmit={analyse} className="space-y-3">
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows={6}
          placeholder="Paste your numbers or KPIs here…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setData(SAMPLE)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-accent"
          >
            Use sample data
          </button>
          <button
            type="submit"
            disabled={loading || !data.trim()}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Analyse
          </button>
        </div>
      </form>

      {loading && <LoadingDots label="Analysing" />}
      <ErrorMessage message={error} />

      {report && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{report}</p>
        </div>
      )}
    </div>
  )
}
