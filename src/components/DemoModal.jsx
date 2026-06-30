import { useEffect, lazy, Suspense } from 'react'
import LoadingDots from './LoadingDots'

// Demos are lazy-loaded so heavy deps (e.g. recharts) stay out of the initial
// bundle and only download when a visitor actually opens a demo.
const REGISTRY = {
  agent: lazy(() => import('../demos/AgentDemo')),
  leadtriage: lazy(() => import('../demos/LeadTriage')),
  dashboard: lazy(() => import('../demos/DashboardGenerator')),
  content: lazy(() => import('../demos/ContentGenerator')),
  translator: lazy(() => import('../demos/Translator')),
  crm: lazy(() => import('../demos/CrmAssistant')),
  n8n: lazy(() => import('../demos/N8nExplainer')),
}

export default function DemoModal({ project, onClose }) {
  useEffect(() => {
    if (!project) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [project, onClose])

  if (!project) return null
  const DemoComponent = REGISTRY[project.demo]

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.icon}</span>
            <div>
              <h3 className="font-semibold text-slate-900">{project.title}</h3>
              <p className="text-xs text-slate-500">Live demo · powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <Suspense fallback={<div className="py-8 text-center"><LoadingDots label="Loading demo" /></div>}>
            {DemoComponent ? <DemoComponent /> : <p>Demo coming soon.</p>}
          </Suspense>
        </div>
      </div>
    </div>
  )
}
