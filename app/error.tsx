'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-200 bg-white text-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
