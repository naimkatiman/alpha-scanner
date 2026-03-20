'use client'

import { useState, useEffect, useMemo } from 'react'
import type { SignalRecord } from '../hooks/useSignalHistory'
import { getSymbolConfig, getAllSymbols } from '../lib/symbols'

const STORAGE_KEY = 'alpha-scanner-signal-history'
const ACCENT = '#eab308'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface LeaderboardEntry {
  key: string
  symbol: string
  mode: string
  total: number
  wins: number
  losses: number
  winRate: number
  avgConfidence: number
  bestStreak: number
  category: 'Metals' | 'Crypto' | 'Forex'
  icon: string
}

/* ── Compute leaderboard from records ───────────────────────────────────────── */

function computeLeaderboard(records: SignalRecord[]): LeaderboardEntry[] {
  const map = new Map<string, {
    symbol: string
    mode: string
    wins: number
    losses: number
    total: number
    confidences: number[]
    streaks: number[]
    currentStreak: number
    lastOutcome: 'win' | 'loss' | null
  }>()

  const resolved = records.filter((r) => r.outcome === 'win' || r.outcome === 'loss')

  for (const r of resolved) {
    const key = `${r.symbol}::${r.mode}`
    if (!map.has(key)) {
      map.set(key, {
        symbol: r.symbol,
        mode: r.mode,
        wins: 0,
        losses: 0,
        total: 0,
        confidences: [],
        streaks: [],
        currentStreak: 0,
        lastOutcome: null,
      })
    }

    const entry = map.get(key)!
    entry.total++
    entry.confidences.push(r.confidence)

    if (r.outcome === 'win') {
      entry.wins++
      if (entry.lastOutcome === 'win') {
        entry.currentStreak++
      } else {
        if (entry.lastOutcome === 'loss' && entry.currentStreak > 0) {
          entry.streaks.push(entry.currentStreak)
        }
        entry.currentStreak = 1
      }
    } else {
      entry.losses++
      if (entry.lastOutcome === 'win' && entry.currentStreak > 0) {
        entry.streaks.push(entry.currentStreak)
      }
      if (entry.lastOutcome !== 'loss') entry.currentStreak = 0
    }
    entry.lastOutcome = r.outcome as 'win' | 'loss'
  }

  const result: LeaderboardEntry[] = []

  for (const [key, e] of map.entries()) {
    if (e.total < 3) continue // minimum to rank

    const cfg = getSymbolConfig(e.symbol)
    const winRate = e.total > 0 ? (e.wins / e.total) * 100 : 0
    const avgConfidence =
      e.confidences.length > 0
        ? e.confidences.reduce((a, b) => a + b, 0) / e.confidences.length
        : 0

    const allStreaks = [...e.streaks, e.currentStreak]
    const bestStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0

    result.push({
      key,
      symbol: e.symbol,
      mode: e.mode,
      total: e.total,
      wins: e.wins,
      losses: e.losses,
      winRate,
      avgConfidence,
      bestStreak,
      category: cfg?.category ?? 'Crypto',
      icon: cfg?.icon ?? '•',
    })
  }

  return result.sort((a, b) => b.winRate - a.winRate)
}

/* ── Win rate bar ───────────────────────────────────────────────────────────── */

function WinRateBar({ value }: { value: number }) {
  const color = value >= 60 ? '#10b981' : value >= 50 ? '#a1a1aa' : '#f43f5e'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#222] overflow-hidden" style={{ minWidth: '60px' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[10px] font-bold w-10 text-right" style={{ color }}>
        {value.toFixed(0)}%
      </span>
    </div>
  )
}

/* ── Rank badge ─────────────────────────────────────────────────────────────── */

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = ['#fbbf24', '#a1a1aa', '#d97706']
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
        style={{ backgroundColor: `${colors[rank - 1]}20`, color: colors[rank - 1] }}
      >
        {rank}
      </span>
    )
  }
  return <span className="font-mono text-[10px] text-zinc-500 w-6 text-center">{rank}</span>
}

/* ── Main component ─────────────────────────────────────────────────────────── */

type CategoryFilter = 'All' | 'Metals' | 'Crypto' | 'Forex'

export default function Leaderboard() {
  const [records, setRecords] = useState<SignalRecord[]>([])
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SignalRecord[]
        setRecords(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const allEntries = useMemo(() => computeLeaderboard(records), [records])

  const filtered = useMemo(
    () =>
      categoryFilter === 'All'
        ? allEntries
        : allEntries.filter((e) => e.category === categoryFilter),
    [allEntries, categoryFilter],
  )

  const categories: CategoryFilter[] = ['All', 'Metals', 'Crypto', 'Forex']

  const CATEGORY_COUNTS = useMemo(() => {
    const counts: Record<CategoryFilter, number> = { All: allEntries.length, Metals: 0, Crypto: 0, Forex: 0 }
    for (const e of allEntries) {
      counts[e.category]++
    }
    return counts
  }, [allEntries])

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#111] overflow-hidden"
      style={{ borderTopColor: ACCENT, borderTopWidth: '2px' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Signal Leaderboard</h3>
          {allEntries.length > 0 && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
            >
              {allEntries.length} ranked
            </span>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06]">
          {/* Category filter tabs */}
          <div className="flex border-b border-white/[0.06]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
                style={{
                  color: categoryFilter === cat ? ACCENT : '#4b5563',
                  borderBottom: categoryFilter === cat ? `2px solid ${ACCENT}` : '2px solid transparent',
                }}
              >
                {cat}
                {CATEGORY_COUNTS[cat] > 0 && (
                  <span className="ml-1 text-[8px] opacity-60">({CATEGORY_COUNTS[cat]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="px-4 py-4 sm:px-5">
            {allEntries.length === 0 ? (
              <div className="py-8 text-center">
                <div className="opacity-30 mb-2"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
                <p className="text-xs text-zinc-500">No ranked entries yet</p>
                <p className="text-[9px] text-zinc-700 mt-1">
                  Signal pairs need at least 3 resolved signals to appear here.
                  Use the dashboard to generate signals.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-zinc-500">No {categoryFilter} entries ranked</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Rank', 'Symbol', 'Mode', 'Signals', 'Win Rate', 'Avg Conf', 'Streak'].map((h) => (
                        <th
                          key={h}
                          className="px-2 py-1.5 text-left font-semibold uppercase tracking-widest text-zinc-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, idx) => (
                      <tr
                        key={entry.key}
                        className="border-b border-[#1a1a1a] hover:bg-white/[0.03] transition-colors"
                      >
                        {/* Rank */}
                        <td className="px-2 py-2">
                          <RankBadge rank={idx + 1} />
                        </td>

                        {/* Symbol */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            
                            <div>
                              <div className="font-semibold text-white text-[10px]">{entry.symbol}</div>
                              <div className="text-[8px] text-zinc-600">{entry.category}</div>
                            </div>
                          </div>
                        </td>

                        {/* Mode */}
                        <td className="px-2 py-2">
                          <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-[8px] font-semibold uppercase text-zinc-500">
                            {entry.mode}
                          </span>
                        </td>

                        {/* Signals */}
                        <td className="px-2 py-2 text-zinc-400">
                          <span className="text-[#10b981]">{entry.wins}</span>
                          <span className="text-zinc-600">/{entry.total}</span>
                        </td>

                        {/* Win Rate bar */}
                        <td className="px-2 py-2" style={{ minWidth: '120px' }}>
                          <WinRateBar value={entry.winRate} />
                        </td>

                        {/* Avg Confidence */}
                        <td className="px-2 py-2 font-mono text-zinc-400">
                          {entry.avgConfidence.toFixed(0)}%
                        </td>

                        {/* Best Streak */}
                        <td className="px-2 py-2 text-center">
                          <span
                            className="font-mono font-bold text-[10px]"
                            style={{ color: entry.bestStreak >= 3 ? '#10b981' : '#6b7280' }}
                          >
                            {entry.bestStreak > 0 ? `${entry.bestStreak}W` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer note */}
            <p className="mt-3 text-[8px] text-zinc-700">
              Ranked by win rate · Minimum 3 resolved signals to qualify · Data from local signal history
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
