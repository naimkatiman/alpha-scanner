'use client'

import { useEffect, useState, useCallback } from 'react'
import { Rss, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

interface Signal {
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
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function outcomeColor(outcome: string) {
  if (outcome === 'HIT_TP1') return 'text-emerald-400'
  if (outcome === 'HIT_SL') return 'text-red-400'
  if (outcome === 'EXPIRED') return 'text-zinc-500'
  return 'text-yellow-400'
}

function SignalSkeleton() {
  return (
    <div className="rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
        <div className="h-4 w-12 rounded bg-white/[0.04]" />
      </div>
      <div className="h-6 w-20 rounded bg-white/[0.06] mb-2" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 rounded bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}

const ALL_SYMBOLS = 'All'

export default function FeedClient() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>(ALL_SYMBOLS)
  const [symbols, setSymbols] = useState<string[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchFeed = useCallback(async (sym?: string) => {
    try {
      const url = sym && sym !== ALL_SYMBOLS
        ? `/api/feed?symbol=${encodeURIComponent(sym)}&limit=50`
        : '/api/feed?limit=50'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Signal[] = await res.json()
      setSignals(data)
      setLastRefresh(new Date())

      // Collect unique symbols
      const unique = Array.from(new Set(data.map((s) => s.symbol))).sort()
      setSymbols(unique)
      setError(null)
    } catch (e) {
      setError('Failed to load signals. Retrying...')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeed(filter)
    const interval = setInterval(() => fetchFeed(filter), 30_000)
    return () => clearInterval(interval)
  }, [fetchFeed, filter])

  const displayed = filter === ALL_SYMBOLS
    ? signals
    : signals.filter((s) => s.symbol === filter)

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.04] bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2">
              <Rss size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Signal Feed</h1>
              <p className="text-[11px] text-zinc-500">
                Auto-refreshes every 30s · last {relativeTime(lastRefresh.toISOString())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Symbol filter */}
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setLoading(true)
              }}
              className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-1.5 text-[12px] text-zinc-300 outline-none focus:border-emerald-500/40"
            >
              <option value={ALL_SYMBOLS}>All Symbols</option>
              {symbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* RSS link */}
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-1.5 text-[11px] font-medium text-orange-400 transition-all hover:bg-orange-500/10"
            >
              <Rss size={11} />
              RSS
            </a>

            <button
              onClick={() => { setLoading(true); fetchFeed(filter) }}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => <SignalSkeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Rss size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No signals yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {displayed.map((signal) => (
              <div
                key={signal.id}
                className="group rounded-xl border border-emerald-500/10 bg-[#0a0a0a] p-4 transition-all hover:border-emerald-500/20 hover:bg-[#0d0d0d]"
              >
                {/* Top row */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-400">
                      {signal.symbol}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wide">{signal.mode}</span>
                  </div>
                  <span className="text-[11px] text-zinc-600">{relativeTime(signal.createdAt)}</span>
                </div>

                {/* Direction + confidence */}
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 text-lg font-bold ${signal.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {signal.direction === 'BUY'
                      ? <TrendingUp size={18} />
                      : <TrendingDown size={18} />}
                    {signal.direction}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-16 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-emerald-500/60"
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400">{signal.confidence}%</span>
                  </div>
                </div>

                {/* Price grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/[0.03] px-2 py-2">
                    <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Entry</div>
                    <div className="text-[12px] font-mono font-semibold text-zinc-200">{signal.entryPrice.toFixed(4)}</div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/[0.04] px-2 py-2">
                    <div className="text-[9px] uppercase tracking-widest text-emerald-700 mb-1">TP1</div>
                    <div className="text-[12px] font-mono font-semibold text-emerald-400">{signal.tp1.toFixed(4)}</div>
                  </div>
                  <div className="rounded-lg bg-red-500/[0.04] px-2 py-2">
                    <div className="text-[9px] uppercase tracking-widest text-red-900 mb-1">SL</div>
                    <div className="text-[12px] font-mono font-semibold text-red-400">{signal.sl.toFixed(4)}</div>
                  </div>
                </div>

                {/* Outcome */}
                <div className="mt-2.5 text-right">
                  <span className={`text-[10px] font-medium ${outcomeColor(signal.outcome)}`}>
                    {signal.outcome.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
