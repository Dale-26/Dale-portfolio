// Renders a dashboard spec ({ title, kpis, charts, insights }) produced by the
// AI as schema-validated JSON. Reusable across demos.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444']

const trendIcon = { up: '▲', down: '▼', flat: '▬' }
const trendColor = { up: 'text-green-600', down: 'text-red-600', flat: 'text-slate-400' }

function Chart({ chart }) {
  const data = Array.isArray(chart.data) ? chart.data : []
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        {chart.type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : chart.type === 'pie' ? (
          <PieChart>
            <Tooltip />
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardView({ spec }) {
  if (!spec) return null
  const kpis = spec.kpis || []
  const charts = spec.charts || []
  const insights = spec.insights || []

  return (
    <div className="space-y-4">
      {spec.title && <h3 className="text-lg font-semibold text-slate-900">{spec.title}</h3>}

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((k, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{k.value}</p>
              {k.delta && (
                <p className={`mt-0.5 text-xs font-medium ${trendColor[k.trend] || 'text-slate-400'}`}>
                  {trendIcon[k.trend] || ''} {k.delta}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {charts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {charts.map((c, i) => (
            <Chart key={i} chart={c} />
          ))}
        </div>
      )}

      {insights.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Insights</h4>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {insights.map((ins, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">•</span>
                {ins}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
