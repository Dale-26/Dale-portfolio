// Small reusable "thinking" indicator used across the chat agent and demos.
export default function LoadingDots({ label = 'Thinking' }) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-500">
      <span className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
      </span>
      <span className="text-sm">{label}…</span>
    </span>
  )
}
