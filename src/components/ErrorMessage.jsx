// Friendly inline error shown when a Claude call fails. Never crashes the UI.
export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="font-medium">Something went wrong. </span>
      {message}
    </div>
  )
}
