import { useEffect } from 'react'
import ContentGenerator from '../demos/ContentGenerator'
import Translator from '../demos/Translator'
import MultiAgentPipeline from '../demos/MultiAgentPipeline'
import KpiAnalyser from '../demos/KpiAnalyser'
import CrmAssistant from '../demos/CrmAssistant'
import N8nExplainer from '../demos/N8nExplainer'

const REGISTRY = {
  content: ContentGenerator,
  translator: Translator,
  pipeline: MultiAgentPipeline,
  kpi: KpiAnalyser,
  crm: CrmAssistant,
  n8n: N8nExplainer,
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
        className="flex w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl"
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
          {DemoComponent ? <DemoComponent /> : <p>Demo coming soon.</p>}
        </div>
      </div>
    </div>
  )
}
