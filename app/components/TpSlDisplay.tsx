'use client'

import { fmt, fmtPips } from '../data/mockSignals'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import { useTpSl } from '../hooks/useTpSl'
import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

interface TpSlDisplayProps {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  leverage: number
  capital: number
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  currentPrice: number
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded`} />
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function TpSlDisplay({
  symbol,
  mode,
  risk,
  leverage,
  capital,
  direction,
  currentPrice,
}: TpSlDisplayProps) {
  const { data, loading } = useTpSl({
    symbol,
    mode,
    risk,
    leverage,
    capital,
    direction,
    currentPrice,
  })

  const isNeutral = direction === 'NEUTRAL'
  const dirColor =
    direction === 'BUY' ? '#10b981' : direction === 'SELL' ? '#f43f5e' : '#a1a1aa'
  const dirBg =
    direction === 'BUY'
      ? 'rgba(59,130,246,0.15)'
      : direction === 'SELL'
        ? 'rgba(239,68,68,0.15)'
        : 'rgba(245,158,11,0.15)'

  const riskPct = risk === 'conservative' ? 1 : risk === 'balanced' ? 2 : 5

  /* ── Derived display data ────────────────────────────────────────────────── */

  const entry = data?.entry ?? currentPrice
  const sl = data?.sl ?? 0
  const tp1 = data?.tp1 ?? 0
  const tp2 = data?.tp2 ?? 0
  const tp3 = data?.tp3 ?? 0
  const slDistance = data?.slDistance ?? 0
  const tp1Distance = Math.abs(tp1 - entry)
  const tp2Distance = Math.abs(tp2 - entry)
  const tp3Distance = Math.abs(tp3 - entry)
  const totalRange = (slDistance + tp3Distance) || 1

  interface LevelData {
    label: string
    price: number
    color: string
    tag: string
    pips: string
    distPercent: number
  }

  const levelsRaw: LevelData[] = [
    {
      label: 'TP3',
      price: tp3,
      color: '#34d399',
      tag: isNeutral ? '1.272 Fib' : '4.236 Fib',
      pips: fmtPips(symbol, tp3Distance),
      distPercent: (tp3Distance / totalRange) * 100,
    },
    {
      label: 'TP2',
      price: tp2,
      color: '#10b981',
      tag: isNeutral ? '1.272 Fib' : '2.618 Fib',
      pips: fmtPips(symbol, tp2Distance),
      distPercent: (tp2Distance / totalRange) * 100,
    },
    {
      label: 'TP1',
      price: tp1,
      color: '#10b981',
      tag: isNeutral ? '1.272 Fib' : '1.618 Fib',
      pips: fmtPips(symbol, tp1Distance),
      distPercent: (tp1Distance / totalRange) * 100,
    },
    {
      label: 'Stop Loss',
      price: sl,
      color: '#f43f5e',
      tag: 'ATR-based',
      pips: fmtPips(symbol, slDistance),
      distPercent: (slDistance / totalRange) * 100,
    },
  ]

  // SELL: SL is above entry, so reverse to show highest price at top
  const levels = direction === 'SELL' ? [...levelsRaw].reverse() : levelsRaw

  const rr = [
    { label: 'TP1', ratio: data ? data.rr1.toFixed(2) : null, color: '#10b981' },
    { label: 'TP2', ratio: data ? data.rr2.toFixed(2) : null, color: '#10b981' },
    { label: 'TP3', ratio: data ? data.rr3.toFixed(2) : null, color: '#34d399' },
  ]

  const pipValDisplay = data
    ? data.pipVal >= 1
      ? `$${data.pipVal.toFixed(2)}/pip`
      : `$${data.pipVal.toFixed(4)}/pip`
    : '—'

  const posDisplay = data ? data.positionSize.toFixed(4) : '—'
  const riskDisplay = data ? `$${data.riskAmount.toFixed(2)}` : '—'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 }}
      className="rounded-xl border border-white/[0.06] bg-[#111] p-4 sm:p-5 transition-all duration-300 glow-teal shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ borderTopColor: '#10b981', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">TP / SL Levels</h3>
          <p className="mt-0.5 text-xs text-zinc-600 truncate">
            Visual price levels · {symbol} · {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!loading && (
            <span className="flex items-center gap-1">
              <Radio size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold tracking-wider text-emerald-500">LIVE</span>
            </span>
          )}
        </div>
      </div>

      {loading && !data ? (
        /* ── Loading shimmer ──────────────────────────────────────────────── */
        <div className="mt-4 space-y-3">
          <SkeletonLine width="w-full" height="h-9" />
          <div className="space-y-2">
            <SkeletonLine height="h-10" />
            <SkeletonLine height="h-10" />
            <SkeletonLine height="h-10" />
            <SkeletonLine height="h-10" />
          </div>
          <SkeletonLine height="h-16" />
          <SkeletonLine height="h-10" />
        </div>
      ) : (
        <>
          {/* Visual price ladder */}
          <div className="mt-4">
            {/* Entry price marker */}
            <div className="mb-3 flex items-center gap-2 sm:gap-3">
              <div className="flex-1 border-t border-dashed border-gray-700" aria-hidden="true" />
              <div className="flex items-center gap-2 rounded-md border border-gray-700 bg-[#1a1a1a] px-2.5 py-1.5 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Entry</span>
                <span className="font-mono text-sm font-bold text-white">
                  {fmt(symbol, entry)}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                  style={{ backgroundColor: dirBg, color: dirColor }}
                >
                  {direction}
                </span>
              </div>
              <div className="flex-1 border-t border-dashed border-gray-700" aria-hidden="true" />
            </div>

            {/* Level rows */}
            <div className="space-y-2">
              {levels.map((level) => (
                <div key={level.label}>
                  <div
                    className="flex items-center justify-between rounded-md border px-3 py-2.5 transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                    style={{
                      borderColor: `${level.color}30`,
                      backgroundColor: `${level.color}08`,
                    }}
                  >
                    {/* Left: label + tag */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: level.color,
                          boxShadow: `0 0 4px ${level.color}60`,
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold text-zinc-300 flex-shrink-0">
                        {level.label}
                      </span>
                      <span
                        className="hidden sm:inline rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{ backgroundColor: `${level.color}18`, color: level.color }}
                      >
                        {level.tag}
                      </span>
                    </div>

                    {/* Right: price + pips */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                      <span className="hidden xs:inline text-[10px] text-zinc-600">
                        {level.pips}
                      </span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: level.color }}
                      >
                        {fmt(symbol, level.price)}
                      </span>
                    </div>
                  </div>

                  {/* Distance bar */}
                  <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-[#222]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, level.distPercent)}%`,
                        backgroundColor: level.color,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk-Reward Summary */}
          <div className="mt-5 rounded-md border border-[#222] bg-[#1a1a1a] p-3">
            <span className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-600">
              Risk-Reward Ratios
            </span>
            <div className="grid grid-cols-3 gap-2">
              {rr.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center rounded border border-[#222] bg-[#111] py-2 transition-all duration-200"
                >
                  <span className="text-[10px] text-zinc-600">{item.label}</span>
                  <span className="font-mono text-sm font-bold" style={{ color: item.color }}>
                    {item.ratio === null ? '—' : `1:${item.ratio}`}
                  </span>
                  {item.ratio !== null && (
                    <div className="mt-1 h-1 w-10 sm:w-12 overflow-hidden rounded-full bg-[#222]">
                      <div className="flex h-full">
                        <div
                          className="h-full bg-[#f43f5e]"
                          style={{ width: `${100 / (1 + parseFloat(item.ratio))}%` }}
                        />
                        <div className="h-full flex-1" style={{ backgroundColor: item.color }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Position info footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-600">Risk</span>
                <span
                  className="text-[10px] font-bold"
                  style={{
                    color:
                      risk === 'conservative'
                        ? '#10b981'
                        : risk === 'balanced'
                          ? '#10b981'
                          : '#f43f5e',
                  }}
                >
                  {riskPct}% ({riskDisplay})
                </span>
              </div>
              <div className="h-3 w-px bg-[#222]" aria-hidden="true" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-600">Pip Value</span>
                <span className="text-[10px] font-bold text-zinc-400">{pipValDisplay}</span>
              </div>
              <div className="h-3 w-px bg-[#222]" aria-hidden="true" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-600">Size</span>
                <span className="font-mono text-[10px] font-bold text-zinc-400">{posDisplay}</span>
              </div>
            </div>
            <span className="text-[9px] text-zinc-700">
              Lev 1:{leverage.toLocaleString()} · ${capital.toLocaleString()}
            </span>
          </div>
        </>
      )}
    </motion.div>
  )
}
