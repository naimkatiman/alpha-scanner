'use client'

import { buildSignal, fmt, fmtPips } from '../data/mockSignals'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import { useSignals } from '../hooks/useSignals'

interface SignalPanelProps {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  loading?: boolean
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded`} />
}

function SignalPanelSkeleton() {
  return (
    <div className="rounded-lg border border-[#222] bg-[#111] p-4 sm:p-5 border-t-2 border-t-[#3b82f6]">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <SkeletonLine width="w-28" height="h-4" />
          <SkeletonLine width="w-40" height="h-2.5" />
        </div>
        <SkeletonLine width="w-12" height="h-6" />
      </div>
      <div className="space-y-2 mb-4">
        <SkeletonLine width="w-20" height="h-2.5" />
        <SkeletonLine height="h-2" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <SkeletonLine key={i} height="h-8" />)}
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <SkeletonLine key={i} height="h-8" />)}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#3b82f6' : value >= 65 ? '#14b8a6' : '#f59e0b'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#222]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-9 text-right font-mono text-xs font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

function TechBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded border px-2.5 py-1.5 transition-all duration-200"
      style={{
        borderColor: active ? 'rgba(59,130,246,0.4)' : '#222',
        backgroundColor: active ? 'rgba(59,130,246,0.08)' : '#1a1a1a',
        boxShadow: active ? '0 0 8px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full transition-colors duration-200"
        style={{ backgroundColor: active ? '#3b82f6' : '#374151' }}
      />
      <span
        className="text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200"
        style={{ color: active ? '#93c5fd' : '#4b5563' }}
      >
        {label}
      </span>
    </div>
  )
}

function PriceRow({
  label,
  value,
  color,
  tag,
}: {
  label: string
  value: string
  color: string
  tag?: string
}) {
  return (
    <div className="flex items-center justify-between rounded border border-[#222] bg-[#1a1a1a] px-3 py-2.5 transition-colors hover:bg-[#202020]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
        {tag && (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {tag}
          </span>
        )}
      </div>
      <span className="font-mono text-xs font-semibold flex-shrink-0 ml-2" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 text-3xl opacity-30">📊</div>
      <p className="text-sm font-medium text-gray-500">No signal available</p>
      <p className="mt-1 text-xs text-gray-600">Select a symbol to generate a signal</p>
    </div>
  )
}

/* ── Direction color helper ──────────────────────────────────────────────── */
function getDirectionColor(direction: 'BUY' | 'SELL' | 'NEUTRAL'): string {
  if (direction === 'BUY') return '#3b82f6'
  if (direction === 'SELL') return '#ef4444'
  return '#f59e0b' // NEUTRAL = amber
}

function getGlowClass(direction: 'BUY' | 'SELL' | 'NEUTRAL'): string {
  if (direction === 'BUY') return 'glow-buy'
  if (direction === 'SELL') return 'glow-sell'
  return '' // no glow for neutral
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function SignalPanel({ symbol, mode, risk, loading = false }: SignalPanelProps) {
  // Fetch real signal from the engine
  const { signal: liveSignal, loading: signalLoading } = useSignals(symbol, mode, risk)

  if (loading || signalLoading) return <SignalPanelSkeleton />
  if (!symbol) return (
    <div className="rounded-lg border border-[#222] bg-[#111] p-4 sm:p-5">
      <EmptyState />
    </div>
  )

  // Use real signal for direction/confidence/technicals/reason
  // Fall back to mock if signal hasn't loaded yet
  const mockSig = buildSignal(symbol, mode, risk)

  const direction = liveSignal?.direction ?? mockSig.direction
  const confidence = liveSignal?.confidence ?? mockSig.confidence
  const technicals = liveSignal?.technicals ?? mockSig.technicals
  const reason = liveSignal?.reason ?? mockSig.reason

  // TP/SL still from mock (TASK-015 will replace)
  const entryPrice = mockSig.entryPrice
  const stopLoss = mockSig.stopLoss
  const tp1 = mockSig.tp1
  const tp2 = mockSig.tp2
  const tp3 = mockSig.tp3

  const dirColor = getDirectionColor(direction)
  const slDistance = Math.abs(entryPrice - stopLoss)
  const rrRatio = (Math.abs(tp1 - entryPrice) / slDistance).toFixed(2)
  const agreingCount = Object.values(technicals).filter(Boolean).length

  const glowClass = getGlowClass(direction)

  return (
    <div
      className={`rounded-lg border border-[#222] bg-[#111] p-4 sm:p-5 transition-all duration-300 ${glowClass}`}
      style={{ borderTopColor: dirColor, borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Signal Panel</h3>
            {/* Direction badge */}
            <span
              className="rounded px-2 py-0.5 text-xs font-bold tracking-widest transition-all duration-300"
              style={{
                backgroundColor: `${dirColor}1a`,
                color: dirColor,
                border: `1px solid ${dirColor}40`,
                boxShadow: `0 0 8px ${dirColor}25`,
              }}
            >
              {direction}
            </span>
            {/* Live indicator */}
            {liveSignal && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">LIVE</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-600 truncate">
            {symbol} · {mode.charAt(0).toUpperCase() + mode.slice(1)} · now
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: dirColor, boxShadow: `0 0 6px ${dirColor}` }}
            aria-hidden="true"
          />
          <span className="text-[10px] text-gray-600 whitespace-nowrap">
            {agreingCount}/4 signals
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-gray-600">Confidence</span>
        </div>
        <ConfidenceBar value={confidence} />
      </div>

      {/* Reason */}
      <div className="mt-3 rounded border border-[#222] bg-[#1a1a1a] px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-600">Analysis</span>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed">{reason}</p>
      </div>

      {/* Technical indicators */}
      <div className="mt-4">
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-gray-600">
          Signal Agreement
        </span>
        <div className="flex flex-wrap gap-2">
          <TechBadge label="RSI" active={technicals.rsi} />
          <TechBadge label="MACD" active={technicals.macd} />
          <TechBadge label="EMA" active={technicals.ema} />
          <TechBadge label="S/R" active={technicals.sr} />
        </div>
      </div>

      {/* Price levels */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-widest text-gray-600">Entry &amp; Targets</span>
          <PriceRow label="Entry" value={fmt(symbol, entryPrice)} color="#e5e7eb" />
          <PriceRow label="TP1" value={fmt(symbol, tp1)} color="#14b8a6" tag="1.618" />
          <PriceRow label="TP2" value={fmt(symbol, tp2)} color="#3b82f6" tag="2.618" />
          <PriceRow label="TP3" value={fmt(symbol, tp3)} color="#818cf8" tag="4.236" />
        </div>

        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-widest text-gray-600">Risk Management</span>
          <PriceRow
            label="Stop Loss"
            value={fmt(symbol, stopLoss)}
            color="#ef4444"
            tag={fmtPips(symbol, slDistance)}
          />

          {/* R:R display */}
          <div className="rounded border border-[#222] bg-[#1a1a1a] px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Risk / Reward</span>
              <span className="font-mono text-xs font-bold text-[#14b8a6]">1 : {rrRatio}</span>
            </div>
            {/* Visual RR bar */}
            <div className="flex h-2 overflow-hidden rounded-full bg-[#222]">
              <div className="h-full bg-[#ef4444]" style={{ width: '20%' }} />
              <div
                className="h-full bg-[#14b8a6]"
                style={{ width: `${Math.min(80, 20 * parseFloat(rrRatio))}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[9px] text-[#ef4444]">Risk 1x</span>
              <span className="text-[9px] text-[#14b8a6]">Reward {rrRatio}x</span>
            </div>
          </div>

          {/* Mode info */}
          <div className="rounded border border-[#333] bg-[#1a1a1a] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600">Mode</span>
              <span className="text-[10px] font-semibold capitalize text-gray-400">{mode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600">Risk Profile</span>
              <span
                className="text-[10px] font-semibold capitalize"
                style={{
                  color: risk === 'conservative' ? '#14b8a6' : risk === 'balanced' ? '#3b82f6' : '#ef4444',
                }}
              >
                {risk}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
