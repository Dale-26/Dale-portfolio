import { useState } from 'react'
import { streamClaude } from '../lib/claude'
import { TRANSLATOR_PROMPT } from '../lib/prompts'
import LoadingDots from '../components/LoadingDots'
import ErrorMessage from '../components/ErrorMessage'

const TONES = ['neutral', 'formal', 'casual', 'business']

function parse(text) {
  const translation =
    text.match(/TRANSLATION:\s*([\s\S]*?)(?:NOTES:|$)/i)?.[1]?.trim() || text.trim()
  const notes = text.match(/NOTES:\s*([\s\S]*)$/i)?.[1]?.trim() || ''
  return { translation, notes }
}

export default function Translator() {
  const [text, setText] = useState('')
  const [thToEn, setThToEn] = useState(false) // false = EN→TH, true = TH→EN
  const [tone, setTone] = useState('neutral')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const direction = thToEn ? 'Thai to English' : 'English to Thai'

  async function translate(e) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      let raw = ''
      await streamClaude({
        system: TRANSLATOR_PROMPT,
        messages: [
          { role: 'user', content: `Direction: ${direction}\nTone: ${tone}\n\nText:\n${text}` },
        ],
        onChunk: (delta) => {
          raw += delta
          setResult(parse(raw))
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Translate between Thai and English with a chosen tone, plus notes on the
        translation choices.
      </p>

      <form onSubmit={translate} className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setThToEn((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-accent"
          >
            {direction} ⇄
          </button>
          <label className="text-sm text-slate-600">Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize outline-none focus:border-accent"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={thToEn ? 'พิมพ์ข้อความภาษาไทยที่นี่…' : 'Type English text here…'}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          Translate
        </button>
      </form>

      {loading && !result && <LoadingDots label="Translating" />}
      <ErrorMessage message={error} />

      {result && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
              Translation
            </h4>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{result.translation}</p>
          </div>
          {result.notes && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </h4>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
