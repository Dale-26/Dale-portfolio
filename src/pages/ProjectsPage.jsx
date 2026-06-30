import { useState } from 'react'
import { projects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import DemoModal from '../components/DemoModal'

export default function ProjectsPage() {
  const [active, setActive] = useState(null)

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Live AI Demos
        </h1>
        <p className="mt-3 text-slate-600">
          Six working tools I built with the Gemini API. Each one is interactive —
          click <span className="font-medium text-accent">Try it</span> and use it
          right here.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onTry={setActive} />
        ))}
      </div>

      <DemoModal project={active} onClose={() => setActive(null)} />
    </section>
  )
}
