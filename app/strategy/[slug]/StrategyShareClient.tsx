'use client'

import { useRouter } from 'next/navigation'
import type { Strategy } from '../../components/StrategyPicker'

interface Props {
  strategy: Strategy
}

const BADGE = 'text-[11px] px-2 py-0.5 rounded-md border font-medium'

export default function StrategyShareClient({ strategy }: Props) {
  const router = useRouter()
  const { config } = strategy

  const handleUse = () => {
    const params = new URLSearchParams({
      symbol: config.symbols?.[0] ?? 'XAUUSD',
      mode: config.mode,
      risk: config.riskProfile,
      leverage: String(config.leverage),
      capital: String(config.capital),
    })
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Alpha Scanner
          </a>
          <h1 className="text-xl font-bold text-white">{strategy.name}</h1>
          {strategy.description && (
            <p className="mt-1.5 text-sm text-zinc-400">{strategy.description}</p>
          )}
        </div>

        {/* Config card */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5 shadow-2xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">Strategy Config</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Symbol</div>
              <div className="text-sm font-semibold text-white">{config.symbols?.join(', ') ?? '—'}</div>
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Mode</div>
              <div className="text-sm font-semibold text-white capitalize">{config.mode}</div>
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Risk Profile</div>
              <div className={`${BADGE} ${
                config.riskProfile === 'conservative'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : config.riskProfile === 'balanced'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {config.riskProfile}
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Leverage</div>
              <div className="text-sm font-semibold text-white">1:{config.leverage}</div>
            </div>

            <div className="col-span-2 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Starting Capital</div>
              <div className="text-sm font-semibold text-white">${config.capital.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={handleUse}
            className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
          >
            Use This Strategy
          </button>
          <a
            href="/"
            className="w-full rounded-xl border border-white/[0.06] py-3 text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Browse Alpha Scanner
          </a>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-700">
          Shared via Alpha Scanner · Not financial advice
        </p>
      </div>
    </div>
  )
}
