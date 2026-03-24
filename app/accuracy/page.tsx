'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp, TrendingDown, Clock, Zap, BarChart2 } from 'lucide-react'

interface SymbolAccuracy {
  symbol: string
  total: number
  hitTP1: number
  hitSL: number
  expired: number
  winRate: number
}

interface AccuracyData {
  overall: {
    totalSignals: number
    hitTP1: number
    hitSL: number
    expired: number
    winRate: number
    pending: number
  }
  bySymbol: SymbolAccuracy[]
  recentRecords: Array<{
    id: string
    symbol: string
    mode: string
    direction: string
    entryPrice: number
    tp1: number
    sl: number
    confidence: number
    outcome: string
    createdAt: string
    resolvedAt: string | null
  }>
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const styles: Record<string, string> = {
    HIT_TP1: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    HIT_SL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    EXPIRED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  return (
    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${styles[outcome] || styles.PENDING}`}>
      {outcome.replace('_', ' ')}
    </span>
  )
}

export default function AccuracyPage() {
  const [data, setData] = useState<AccuracyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/accuracy')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <Target size={16} className="text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Signal Accuracy</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Page title */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">Performance</p>
          <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
            Accuracy<br />
            <span className="text-emerald-400">Metrics</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-500 max-w-md">
            Live win-rate tracking across all symbols and signal modes.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-white/[0.03] skeleton" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-white/[0.03] skeleton" />
            ))}
          </div>
        ) : !data || data.overall.totalSignals === 0 ? (
          /* Empty state — cockpit-style */
          <div className="border border-white/[0.06] rounded-2xl bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04]">
              <BarChart2 size={14} className="text-zinc-700" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-700 font-medium">No data</span>
            </div>
            <div className="px-6 py-12 text-center">
              <Target size={32} className="mx-auto mb-4 text-zinc-800" />
              <p className="text-sm font-semibold text-zinc-500">No signal data yet</p>
              <p className="mt-1.5 text-xs text-zinc-700 max-w-xs mx-auto">
                Accuracy tracking starts automatically once signals are generated and resolved.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Zap size={12} />
                View Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Stats — cockpit divide-x row */}
            <div className="flex flex-wrap items-stretch divide-x divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden mb-8">
              <div className="flex-1 min-w-[100px] px-5 py-4">
                <p className="data-label">Total</p>
                <p className="data-value text-xl mt-1">{data.overall.totalSignals}</p>
              </div>
              <div className="flex-1 min-w-[100px] px-5 py-4 bg-emerald-500/[0.03]">
                <p className="data-label text-emerald-700">Win Rate</p>
                <p className="data-value text-xl mt-1 text-emerald-400">{data.overall.winRate}%</p>
              </div>
              <div className="flex-1 min-w-[100px] px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={10} className="text-emerald-500" />
                  <p className="data-label">Hit TP1</p>
                </div>
                <p className="data-value text-xl text-emerald-400">{data.overall.hitTP1}</p>
              </div>
              <div className="flex-1 min-w-[100px] px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={10} className="text-rose-500" />
                  <p className="data-label">Hit SL</p>
                </div>
                <p className="data-value text-xl text-rose-400">{data.overall.hitSL}</p>
              </div>
              <div className="flex-1 min-w-[100px] px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={10} className="text-yellow-500" />
                  <p className="data-label">Pending</p>
                </div>
                <p className="data-value text-xl text-yellow-400">{data.overall.pending}</p>
              </div>
            </div>

            {/* Per-Symbol Accuracy */}
            <div className="mb-2 flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">By Symbol</p>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>
            <div className="space-y-1.5 mb-8 border border-white/[0.06] rounded-xl overflow-hidden bg-[#0a0a0a]">
              {data.bySymbol
                .sort((a, b) => b.winRate - a.winRate)
                .map((s, i) => (
                  <div
                    key={s.symbol}
                    className={`flex items-center gap-4 px-4 py-3 ${i < data.bySymbol.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    <div className="flex items-center gap-2 w-28">
                      <Zap size={10} className="text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold font-mono">{s.symbol}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${s.winRate}%` }}
                        />
                        <div
                          className="h-full bg-rose-500 transition-all"
                          style={{ width: `${s.total > 0 ? (s.hitSL / s.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right font-mono text-sm font-bold tabular-nums text-emerald-400">
                      {s.winRate}%
                    </span>
                    <span className="w-16 text-right font-mono text-[11px] tabular-nums text-zinc-600">{s.total} sig</span>
                  </div>
                ))}
            </div>

            {/* Recent Records */}
            <div className="mb-2 flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Recent Signals</p>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0a0a0a]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Symbol</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Dir</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Entry</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">TP1</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">SL</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Conf</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Outcome</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRecords.map((r, i) => (
                    <tr key={r.id} className={`hover:bg-white/[0.02] ${i < data.recentRecords.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                      <td className="px-3 py-2 font-mono font-semibold text-white">{r.symbol}</td>
                      <td className="px-3 py-2">
                        <span className={`font-mono font-bold text-[11px] ${r.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">{r.entryPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums text-emerald-400">{r.tp1.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums text-rose-400">{r.sl.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums text-zinc-400">{r.confidence}%</td>
                      <td className="px-3 py-2"><OutcomeBadge outcome={r.outcome} /></td>
                      <td className="px-3 py-2 font-mono text-zinc-600 text-[10px]">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
