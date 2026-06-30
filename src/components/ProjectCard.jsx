export default function ProjectCard({ project, onTry }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-2xl">
        {project.icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {t}
          </span>
        ))}
      </div>
      <button
        onClick={() => onTry(project)}
        className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
      >
        Try it →
      </button>
    </div>
  )
}
