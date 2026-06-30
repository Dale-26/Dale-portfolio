import { useState } from 'react'
import { callClaudeJSON } from '../lib/claude'
import { DASHBOARD_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'
import DashboardView from '../components/DashboardView'

const SAMPLE = `Monthly revenue (THB): Jan 1.2M, Feb 1.05M, Mar 1.4M, Apr 1.6M
New customers: Jan 120, Feb 95, Mar 160, Apr 180
Channel split: Organic 45%, Paid 30%, Referral 25%
Churn: 4% -> 6% -> 3% -> 3%`

// Gemini responseSchema describing the dashboard spec.
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    kpis: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          value: { type: 'STRING' },
          delta: { type: 'STRING' },
          trend: { type: 'STRING', enum: ['up', 'down', 'flat'] },
        },
        required: ['label', 'value'],
      },
    },
    charts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ['bar', 'line', 'pie'] },
          title: { type: 'STRING' },
          data: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { name: { type: 'STRING' }, value: { type: 'NUMBER' } },
              required: ['name', 'value'],
            },
          },
        },
        required: ['type', 'title', 'data'],
      },
    },
    insights: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'kpis', 'charts', 'insights'],
}

export default function DashboardGenerator() {
  const [data, setData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [spec, setSpec] = useState(null)

  async function generate(e) {
    e.preventDefault()
    if (!data.trim() || loading) return
    setError('')
    setSpec(null)
    setLoading(true)
    try {
      const result = await callClaudeJSON({
        system: DASHBOARD_PROMPT,
        messages: [{ role: 'user', content: data }],
        schema: SCHEMA,
      })
      setSpec(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Paste raw data or describe a goal. The AI returns a{' '}
        <span className="font-medium">schema-validated</span> dashboard spec,
        rendered here as live KPI cards and charts.
      </p>

      <form onSubmit={generate} className="space-y-3">
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows={5}
          placeholder="Paste numbers, metrics, or describe what you want to see…"
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
            Generate dashboard
          </button>
        </div>
      </form>

      {loading && <LoadingDots label="Building dashboard" />}
      <ErrorMessage message={error} />

      {spec && <DashboardView spec={spec} />}
    </div>
  )
}
