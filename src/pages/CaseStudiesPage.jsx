import { Link } from 'react-router-dom'
import { caseStudies } from '../data/caseStudies'

function CaseStudy({ cs, index }) {
  const flip = index % 2 === 1
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className={`grid gap-8 lg:grid-cols-2 ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        {/* Narrative */}
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light text-2xl">
              {cs.icon}
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{cs.title}</h2>
              <p className="text-sm text-slate-500">{cs.tagline}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                Problem
              </h3>
              <p className="text-slate-600">{cs.problem}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Approach
              </h3>
              <ul className="space-y-1.5 text-slate-600">
                {cs.approach.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Results + meta */}
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">
              Result
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {cs.result.map(([value, label], i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-base font-bold text-slate-900 sm:text-lg">{value}</p>
                  <p className="mt-1 text-[11px] leading-tight text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Built with
            </h3>
            <div className="flex flex-wrap gap-2">
              {cs.stack.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <Link
            to={`/projects?demo=${cs.demo}`}
            className="mt-auto inline-block w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Try it live →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CaseStudiesPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Case Studies
        </h1>
        <p className="mt-3 text-slate-600">
          Real automation problems, how I designed the solution, and the outcome.
          Each one is a working system you can try live.
        </p>
      </div>

      <div className="space-y-6">
        {caseStudies.map((cs, i) => (
          <CaseStudy key={cs.id} cs={cs} index={i} />
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-accent-light p-6 text-center">
        <p className="text-sm text-slate-700">
          Want to see these run? Every case study above is a live, interactive demo.
        </p>
        <Link
          to="/projects"
          className="mt-3 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Explore all demos
        </Link>
      </div>
    </section>
  )
}
