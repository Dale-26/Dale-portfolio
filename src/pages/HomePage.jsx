import { Link } from 'react-router-dom'
import ChatAgent from '../components/ChatAgent'

function HeroSection() {
  return (
    <div className="space-y-6">
      <span className="inline-flex items-center rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark">
        AI Innovation Intern · Bangkok
      </span>
      <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
        I build <span className="text-accent">AI automation</span> that does real work.
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        Hi, I&apos;m Dale. I design AI agents, prompt workflows, and automation
        pipelines with the Claude API and n8n. This whole site is a live demo —
        talk to my AI assistant, or try the projects yourself.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/projects"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          Explore live demos
        </Link>
        <Link
          to="/about"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400"
        >
          About me
        </Link>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <HeroSection />
        <div>
          <p className="mb-3 text-center text-sm font-medium text-slate-500 lg:text-left">
            👇 Try it — ask my AI assistant anything
          </p>
          <ChatAgent />
        </div>
      </div>
    </section>
  )
}
