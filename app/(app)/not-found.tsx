import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <p className="text-5xl font-bold text-zinc-200 mb-4">404</p>
      <h2 className="text-lg font-semibold text-zinc-900 mb-2">Page not found</h2>
      <p className="text-sm text-zinc-500 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700"
      >
        Go to dashboard
      </Link>
    </div>
  )
}
