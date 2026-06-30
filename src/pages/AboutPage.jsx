const SKILLS = [
  { label: 'Claude API', icon: '🤖' },
  { label: 'n8n', icon: '⚙️' },
  { label: 'React', icon: '⚛️' },
  { label: 'Python', icon: '🐍' },
  { label: 'Prompt Engineering', icon: '💬' },
  { label: 'API Integration', icon: '🔌' },
  { label: 'AI Agents', icon: '🧠' },
  { label: 'CRM Systems', icon: '🤝' },
]

const TOOLS = ['Claude', 'n8n', 'Make', 'Zapier', 'GitHub', 'Vercel']

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Bio */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          About Dale
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          I&apos;m an AI innovation intern based in Bangkok, focused on turning AI
          into practical automation. I&apos;ve built AI agents, multi-agent
          pipelines, prompt workflows, web analysers, and CRM tooling with the
          Claude API and n8n. I&apos;m now looking for an AI Automation
          Planner/Manager role where I can plan and ship automation that saves
          real teams real time.
        </p>
      </div>

      {/* Skills */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">Skills</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SKILLS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center"
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="text-sm font-medium text-slate-700">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">Tools I use</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {TOOLS.map((t) => (
            <span
              key={t}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* CV */}
      <div className="mt-12 rounded-2xl bg-accent-light p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Want the full picture?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Download my CV or reach out to talk automation.
          </p>
        </div>
        <a
          href="#"
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark sm:mt-0"
        >
          Download CV
        </a>
      </div>
    </section>
  )
}
