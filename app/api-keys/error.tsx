'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Warning, ArrowsClockwise } from '@phosphor-icons/react'

export default function ApiKeysError({
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
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-rose-500/20 rounded-2xl bg-[#0a0a0a] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-rose-500/5">
          <Warning size={11} className="text-rose-400" />
          <span className="text-[10px] uppercase tracking-widest text-rose-600 font-medium">API Keys Error</span>
        </div>
        <div className="px-5 py-6">
          <p className="text-sm font-semibold text-white mb-1">Failed to load API keys</p>
          <p className="text-xs text-zinc-600 font-mono mb-5">
            {error.digest ? `ERR::${error.digest}` : 'API key management unavailable'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] transition-colors"
            >
              <ArrowsClockwise size={11} />
              Retry
            </button>
            <Link href="/dashboard" className="flex items-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
