'use client'

import { useState } from 'react'
import { useMTF } from '../hooks/useMTF'
import type { TimeframeSignal, Timeframe } from '../api/mtf/route'
import type { SignalDirection } from '../lib/signalEngine'

interface MultiTimeframeProps {
  symbol: string
}

/* ── Color helpers ────────────────────────────────────────────────────────── */

function dirColor(dir: SignalDirection): string {
  if (dir === 'BUY') return '#10b981'
  if (dir === 'SELL') return '#f43f5e'
  return '#a1a1aa'
}

function dirBg(dir: SignalDirection): string {
  if (dir === 'BUY') return 'rgba(59,130,246,0.1)'
  if (dir === 'SELL') return 'rgba(239,68,68,0.1)'
  return 'rgba(245,158,11,0.1)'
}

function emaColor(alignment: 'bullish' | 'bearish' | 'neutral'): string {
  if (alignment === 'bullish') return '#14b8a6'
  if (alignment === 'bearish') return '#f43f5e'
  return '#6b7280'
}

const TF_LABELS: Record<Timeframe, string> = {
  M15: '15 Min',
  H1: '1 Hour',
  H4: '4 Hour',
  D1: 'Daily',
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-3 animate-pulse">
      <div className="h-3 w-12 rounded bg-[#222] mb-3" />
      <div className="h-8 w-full rounded bg-[#222] mb-2" />
      <div className="h-2 w-16 rounded bg-[#222]" />
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */

export default function MultiTimeframe({ symbol }: MultiTimeframeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { data, loading, error } = useMTF(symbol)

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]"
      style={{ borderTopColor: '#06b6d4', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <button
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-4 hover:bg-white/[0.03] transition-colors rounded-t-lg"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Multi-Timeframe</h3>
          <span className="hidden sm:inline text-xs text-zinc-600">
            · {symbol} · M15 · H1 · H4 · D1
          </span>
          {data?.confluence && data.confluence.direction !== 'NEUTRAL' && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: dirBg(data.confluence.direction),
                color: dirColor(data.confluence.direction),
              }}
            >
              {data.confluence.agreeing}/{data.confluence.total} {data.confluence.direction}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-zinc-600 flex-shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-white/[0.06] px-4 pb-4 sm:px-5 sm:pb-5">
          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-4 rounded-md border border-[#333] bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
              Unable to load multi-timeframe data · {error}
            </div>
          )}

          {/* Data */}
          {!loading && !error && data && (
            <div className="space-y-4 pt-4">
              {/* Timeframe cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {data.timeframes.map((tf) => (
                  <TimeframeCard key={tf.timeframe} signal={tf} />
                ))}
              </div>

              {/* Confluence meter */}
              <div className="rounded-md border border-white/[0.06] bg-[#0a0a0a] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                    Confluence Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: dirBg(data.confluence.direction),
                        color: dirColor(data.confluence.direction),
                      }}
                    >
                      {data.confluence.direction}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${data.confluence.score}%`,
                        backgroundColor: dirColor(data.confluence.direction),
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-sm font-bold w-12 text-right"
                    style={{ color: dirColor(data.confluence.direction) }}
                  >
                    {data.confluence.score}%
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-[9px] text-zinc-700">
                  <span>
                    {data.confluence.agreeing} of {data.confluence.total} timeframes agree
                  </span>
                  <span>
                    {data.confluence.score >= 75
                      ? 'Strong confluence'
                      : data.confluence.score >= 50
                      ? 'Moderate confluence'
                      : 'Weak confluence'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Timeframe Card ───────────────────────────────────────────────────────── */

function TimeframeCard({ signal }: { signal: TimeframeSignal }) {
  const color = dirColor(signal.direction)
  const rsiColor = signal.rsi < 30 ? '#14b8a6' : signal.rsi > 70 ? '#f43f5e' : '#6b7280'

  return (
    <div
      className="rounded-md border bg-white/[0.03] p-3 transition-all hover:bg-white/[0.05]"
      style={{ borderColor: `${color}30` }}
    >
      {/* Timeframe label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {TF_LABELS[signal.timeframe]}
        </span>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
        />
      </div>

      {/* Direction */}
      <div className="text-center mb-2">
        <span
          className="inline-block rounded px-2 py-1 text-xs font-bold tracking-widest"
          style={{
            backgroundColor: dirBg(signal.direction),
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {signal.direction}
        </span>
      </div>

      {/* Confidence */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-zinc-600">Confidence</span>
          <span className="font-mono text-[10px] font-bold" style={{ color }}>
            {signal.confidence}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-[#222] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${signal.confidence}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Quick indicators */}
      <div className="space-y-1">
        {isFinite(signal.rsi) && (
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-zinc-600">RSI</span>
            <span className="font-mono text-[9px] font-bold" style={{ color: rsiColor }}>
              {signal.rsi.toFixed(0)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-zinc-600">EMA</span>
          <span
            className="text-[8px] font-semibold capitalize"
            style={{ color: emaColor(signal.emaAlignment) }}
          >
            {signal.emaAlignment}
          </span>
        </div>
      </div>
    </div>
  )
}
