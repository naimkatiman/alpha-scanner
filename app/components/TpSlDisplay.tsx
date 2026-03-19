'use client'

import { buildSignal, fmt, fmtPips, pipValue } from '../data/mockSignals'
import type { TradingMode, RiskProfile } from '../data/mockSignals'

interface TpSlDisplayProps {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
}

interface LevelData {
  label: string
  price: number
  color: string
  tag?: string
  pips: string
  distPercent: number // % from entry
}

function buildLevels(symbol: string, mode: TradingMode): {
  direction: 'BUY' | 'SELL'
  entry: number
  levels: LevelData[]
  rr1: string
  rr2: string
  rr3: string
  totalRange: number
} {
  // Use 'balanced' risk — price levels are risk-independent
  const sig = buildSignal(symbol, mode, 'balanced')

  const slDistance = Math.abs(sig.entryPrice - sig.stopLoss)
  const tp1Distance = Math.abs(sig.tp1 - sig.entryPrice)
  const tp2Distance = Math.abs(sig.tp2 - sig.entryPrice)
  const tp3Distance = Math.abs(sig.tp3 - sig.entryPrice)
  const totalRange = slDistance + tp3Distance

  const levels: LevelData[] = [
    {
      label: 'TP3',
      price: sig.tp3,
      color: '#818cf8',
      tag: '4.236 Fib',
      pips: fmtPips(symbol, tp3Distance),
      distPercent: (tp3Distance / totalRange) * 100,
    },
    {
      label: 'TP2',
      price: sig.tp2,
      color: '#3b82f6',
      tag: '2.618 Fib',
      pips: fmtPips(symbol, tp2Distance),
      distPercent: (tp2Distance / totalRange) * 100,
    },
    {
      label: 'TP1',
      price: sig.tp1,
      color: '#14b8a6',
      tag: '1.618 Fib',
      pips: fmtPips(symbol, tp1Distance),
      distPercent: (tp1Distance / totalRange) * 100,
    },
    {
      label: 'Stop Loss',
      price: sig.stopLoss,
      color: '#ef4444',
      tag: undefined,
      pips: fmtPips(symbol, slDistance),
      distPercent: (slDistance / totalRange) * 100,
    },
  ]

  // For SELL, TPs are below entry and SL above — reverse visual order
  if (sig.direction === 'SELL') {
    levels.reverse()
  }

  return {
    direction: sig.direction,
    entry: sig.entryPrice,
    levels,
    rr1: (tp1Distance / slDistance).toFixed(2),
    rr2: (tp2Distance / slDistance).toFixed(2),
    rr3: (tp3Distance / slDistance).toFixed(2),
    totalRange,
  }
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function TpSlDisplay({ symbol, mode, risk }: TpSlDisplayProps) {
  const data = buildLevels(symbol, mode)
  const isBuy = data.direction === 'BUY'

  // Risk % based on profile
  const riskPct = risk === 'conservative' ? 1 : risk === 'balanced' ? 2 : 5

  return (
    <div
      className="rounded-lg border border-[--color-border] bg-[--color-card] p-5"
      style={{ borderTopColor: '#14b8a6', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">TP / SL Levels</h3>
          <p className="mt-0.5 text-xs text-gray-600">
            Visual price levels · {symbol} · {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </p>
        </div>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: '#14b8a6', boxShadow: '0 0 6px #14b8a6' }}
        />
      </div>

      {/* Visual price ladder */}
      <div className="mt-4">
        <div className="relative">
          {/* Entry price marker */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex-1 border-t border-dashed border-gray-600" />
            <div className="flex items-center gap-2 rounded-md border border-gray-600 bg-[--color-card-alt] px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Entry</span>
              <span className="font-mono text-sm font-bold text-white">{fmt(symbol, data.entry)}</span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                style={{
                  backgroundColor: isBuy ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                  color: isBuy ? '#3b82f6' : '#ef4444',
                }}
              >
                {data.direction}
              </span>
            </div>
            <div className="flex-1 border-t border-dashed border-gray-600" />
          </div>

          {/* Level rows */}
          <div className="space-y-2">
            {data.levels.map((level) => (
              <div key={level.label} className="group relative">
                <div
                  className="flex items-center justify-between rounded-md border px-3 py-2.5 transition-all duration-200 hover:brightness-110"
                  style={{
                    borderColor: `${level.color}30`,
                    backgroundColor: `${level.color}08`,
                  }}
                >
                  {/* Left: label + tag */}
                  <div className="flex items-center gap-2">
                    {/* Colored dot */}
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: level.color, boxShadow: `0 0 4px ${level.color}60` }}
                    />
                    <span className="text-xs font-semibold text-gray-300">{level.label}</span>
                    {level.tag && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${level.color}18`, color: level.color }}
                      >
                        {level.tag}
                      </span>
                    )}
                  </div>

                  {/* Right: price + pips */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600">{level.pips}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: level.color }}>
                      {fmt(symbol, level.price)}
                    </span>
                  </div>
                </div>

                {/* Distance bar */}
                <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-[--color-border]">
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
      </div>

      {/* Risk-Reward Summary */}
      <div className="mt-5 rounded-md border border-[--color-border] bg-[--color-card-alt] p-3">
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-gray-600">
          Risk-Reward Ratios
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'TP1', ratio: data.rr1, color: '#14b8a6' },
            { label: 'TP2', ratio: data.rr2, color: '#3b82f6' },
            { label: 'TP3', ratio: data.rr3, color: '#818cf8' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded border border-[--color-border] bg-[--color-card] py-2"
            >
              <span className="text-[10px] text-gray-600">{item.label}</span>
              <span className="font-mono text-sm font-bold" style={{ color: item.color }}>
                1:{item.ratio}
              </span>
              {/* Mini bar */}
              <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-[--color-border]">
                <div className="flex h-full">
                  <div className="h-full bg-[#ef4444]" style={{ width: `${100 / (1 + parseFloat(item.ratio))}%` }} />
                  <div className="h-full" style={{ backgroundColor: item.color, flex: 1 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position info footer */}
      <div className="mt-3 flex items-center justify-between rounded-md border border-[--color-border-subtle] bg-[--color-card-alt] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-600">Risk</span>
            <span
              className="text-[10px] font-bold"
              style={{
                color: risk === 'conservative' ? '#14b8a6' : risk === 'balanced' ? '#3b82f6' : '#ef4444',
              }}
            >
              {riskPct}%
            </span>
          </div>
          <div className="h-3 w-px bg-[--color-border]" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-600">Pip Value</span>
            <span className="text-[10px] font-bold text-gray-400">
              {pipValue(symbol, 500, 1000)}
            </span>
          </div>
        </div>
        <span className="text-[9px] text-gray-700">Lev 1:1000 · $500</span>
      </div>
    </div>
  )
}
