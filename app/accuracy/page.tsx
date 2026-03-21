'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react'

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
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-emerald-500" />
            <h1 className="text-sm font-semibold">Signal Accuracy</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : !data || data.overall.totalSignals === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Target size={48} className="mb-4 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-400">No signal data yet</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Signal accuracy tracking starts automatically as signals are generated.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <div className="rounded-xl border border-white/[0.06] bg-[#111] p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Total Signals</p>
                <p className="mt-1 text-2xl font-bold">{data.overall.totalSignals}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[10px] uppercase tracking-widest text-emerald-600">Win Rate</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">{data.overall.winRate}%</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#111] p-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">Hit TP1</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-emerald-400">{data.overall.hitTP1}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#111] p-4">
                <div className="flex items-center gap-1.5">
                  <TrendingDown size={12} className="text-rose-500" />
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">Hit SL</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-rose-400">{data.overall.hitSL}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#111] p-4">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-yellow-500" />
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">Pending</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-yellow-400">{data.overall.pending}</p>
              </div>
            </div>

            {/* Per-Symbol Accuracy */}
            <h2 className="mb-4 text-sm font-semibold text-zinc-400">Accuracy by Symbol</h2>
            <div className="space-y-2 mb-8">
              {data.bySymbol
                .sort((a, b) => b.winRate - a.winRate)
                .map((s) => (
                  <div
                    key={s.symbol}
                    className="flex items-center gap-4 rounded-lg border border-white/[0.06] bg-[#111] px-4 py-3"
                  >
                    <div className="flex items-center gap-2 w-28">
                      <Zap size={12} className="text-emerald-500" />
                      <span className="text-sm font-semibold">{s.symbol}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
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
                    <span className="w-12 text-right font-mono text-sm font-bold text-emerald-400">
                      {s.winRate}%
                    </span>
                    <span className="w-16 text-right text-xs text-zinc-500">{s.total} signals</span>
                  </div>
                ))}
            </div>

            {/* Recent Records */}
            <h2 className="mb-4 text-sm font-semibold text-zinc-400">Recent Signals</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-zinc-600">
                    <th className="px-3 py-2">Symbol</th>
                    <th className="px-3 py-2">Direction</th>
                    <th className="px-3 py-2">Entry</th>
                    <th className="px-3 py-2">TP1</th>
                    <th className="px-3 py-2">SL</th>
                    <th className="px-3 py-2">Conf</th>
                    <th className="px-3 py-2">Outcome</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRecords.map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-semibold">{r.symbol}</td>
                      <td className="px-3 py-2">
                        <span className={r.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                          {r.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono">{r.entryPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400">{r.tp1.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-rose-400">{r.sl.toFixed(2)}</td>
                      <td className="px-3 py-2">{r.confidence}%</td>
                      <td className="px-3 py-2"><OutcomeBadge outcome={r.outcome} /></td>
                      <td className="px-3 py-2 text-zinc-500">
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
