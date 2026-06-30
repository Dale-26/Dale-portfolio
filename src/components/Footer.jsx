export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Dale · AI Automation Portfolio</p>
        <p>
          Built with React, Tailwind &amp; the{' '}
          <span className="font-medium text-accent">Gemini API</span>
        </p>
      </div>
    </footer>
  )
}
