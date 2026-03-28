'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-zinc-900 text-white px-5 py-2 text-sm font-medium hover:bg-zinc-700"
    >
      Print / Save as PDF
    </button>
  )
}
