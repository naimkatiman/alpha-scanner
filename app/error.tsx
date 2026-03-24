'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react'

export default function RootError({
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
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md border border-rose-500/20 rounded-2xl bg-[#0a0a0a] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-rose-500/5">
          <AlertTriangle size={12} className="text-rose-400" />
          <span className="text-[10px] uppercase tracking-widest text-rose-600 font-medium">System Error</span>
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={18} className="text-emerald-500" />
            <span className="font-bold text-sm text-gradient-emerald">Alpha Scanner</span>
          </div>

          <p className="text-sm font-semibold text-white mb-1">Something went wrong</p>
          <p className="text-xs text-zinc-600 font-mono mb-6">
            {error.digest ? `ERR::${error.digest}` : 'An unexpected error occurred'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <RefreshCw size={12} />
              Try again
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
