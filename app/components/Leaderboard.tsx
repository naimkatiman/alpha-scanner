'use client'

import { useLeaderboard, type Period } from '../hooks/useLeaderboard'

/* ── Win rate bar ───────────────────────────────────────────────────────────── */

function WinRateBar({ value }: { value: number }) {
  const color = value >= 60 ? '#10b981' : value >= 50 ? '#a1a1aa' : '#f43f5e'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden" style={{ minWidth: '60px' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[10px] font-bold w-10 text-right" style={{ color }}>
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

/* ── Rank badge ─────────────────────────────────────────────────────────────── */

function RankBadge({ rank }: { rank: number }) {
  const trophies = ['🥇', '🥈', '🥉']
  if (rank <= 3) {
    return <span className="text-base leading-none">{trophies[rank - 1]}</span>
  }
  return <span className="font-mono text-[10px] text-zinc-500 w-6 text-center inline-block">{rank}</span>
}

/* ── Loading skeleton ───────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  )
}

/* ── Summary cards ──────────────────────────────────────────────────────────── */

function SummaryCards({
  totalSignals,
  overallWinRate,
  mostAccurate,
}: {
  totalSignals: number
  overallWinRate: number
  mostAccurate: string | null
}) {
  const cards = [
    { label: 'Total Signals', value: totalSignals.toLocaleString(), accent: false },
    {
      label: 'Overall Win Rate',
      value: `${overallWinRate.toFixed(1)}%`,
      accent: overallWinRate >= 55,
    },
    { label: 'Most Accurate Pair', value: mostAccurate ?? '—', accent: !!mostAccurate },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-emerald-500/10 bg-white/[0.03] px-3 py-3 text-center backdrop-blur-sm"
        >
          <div
            className="text-base font-bold font-mono"
            style={{ color: c.accent ? '#10b981' : '#e4e4e7' }}
          >
            {c.value}
          </div>
          <div className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'All Time', value: 'all' },
]

export default function Leaderboard() {
  const { data, summary, loading, error, period, setPeriod } = useLeaderboard()

  return (
    <div className="rounded-2xl border border-emerald-500/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      {/* Period tabs */}
      <div className="flex border-b border-white/[0.06]">
        {PERIODS.map((p) => {
          const active = period === p.value
          return (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: active ? '#10b981' : '#6b7280',
                borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                background: active ? 'rgba(16,185,129,0.04)' : 'transparent',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="px-4 py-4 sm:px-5">
        {/* Summary cards */}
        {summary && !loading && (
          <SummaryCards
            totalSignals={summary.totalSignals}
            overallWinRate={summary.overallWinRate}
            mostAccurate={summary.mostAccurate}
          />
        )}

        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-xs text-rose-400">Failed to load leaderboard</p>
            <p className="text-[9px] text-zinc-600 mt-1">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2 opacity-40">🏆</div>
            <p className="text-xs text-zinc-500">No ranked entries yet</p>
            <p className="text-[9px] text-zinc-700 mt-1">
              At least 3 resolved signals per pair are required to appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Rank', 'Symbol', 'Mode', 'Signals', 'Win Rate', 'Streak'].map((h) => (
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
                {data.map((entry, idx) => (
                  <tr
                    key={`${entry.symbol}::${entry.mode}`}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Rank */}
                    <td className="px-2 py-2.5">
                      <RankBadge rank={idx + 1} />
                    </td>

                    {/* Symbol */}
                    <td className="px-2 py-2.5">
                      <span className="font-semibold text-white">{entry.symbol}</span>
                    </td>

                    {/* Mode */}
                    <td className="px-2 py-2.5">
                      <span className="rounded border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 text-[8px] font-semibold uppercase text-emerald-400/70">
                        {entry.mode}
                      </span>
                    </td>

                    {/* Signals */}
                    <td className="px-2 py-2.5 text-zinc-400">
                      <span className="text-emerald-400">{entry.wins}</span>
                      <span className="text-zinc-600">/{entry.total}</span>
                    </td>

                    {/* Win Rate bar */}
                    <td className="px-2 py-2.5" style={{ minWidth: '130px' }}>
                      <WinRateBar value={entry.winRate} />
                    </td>

                    {/* Streak */}
                    <td className="px-2 py-2.5 text-center">
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

        <p className="mt-3 text-[8px] text-zinc-700">
          Ranked by win rate · Min 3 resolved signals to qualify · Server-side data · Refreshes every 60s
        </p>
      </div>
    </div>
  )
}
