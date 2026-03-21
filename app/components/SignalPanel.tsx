'use client'

import { buildSignal, fmt, fmtPips } from '../data/mockSignals'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import { useSignals } from '../hooks/useSignals'
import ShareSignal from './ShareSignal'
import { motion } from 'framer-motion'
import { Radio, Target, Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SignalPanelProps {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  loading?: boolean
}

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded`} />
}

function SignalPanelSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
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
  const color = value >= 80 ? '#10b981' : value >= 65 ? '#10b981' : '#a1a1aa'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ ...spring, delay: 0.2 }}
        />
      </div>
      <span className="w-9 text-right font-mono text-xs font-bold tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

function TechBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <motion.div
      className="flex items-center gap-1.5 rounded border px-2.5 py-1.5 transition-all duration-200"
      style={{
        borderColor: active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)',
        backgroundColor: active ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
        boxShadow: active ? '0 0 8px rgba(16,185,129,0.12)' : 'none',
      }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full transition-colors duration-200"
        style={{ backgroundColor: active ? '#10b981' : '#3f3f46' }}
      />
      <span
        className="text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200"
        style={{ color: active ? '#6ee7b7' : '#52525b' }}
      >
        {label}
      </span>
    </motion.div>
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
    <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-zinc-500 flex-shrink-0">{label}</span>
        {tag && (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {tag}
          </span>
        )}
      </div>
      <span className="font-mono text-xs font-semibold flex-shrink-0 ml-2 tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Target size={32} className="mb-3 text-zinc-700" />
      <p className="text-sm font-medium text-zinc-500">No signal available</p>
      <p className="mt-1 text-xs text-zinc-600">Select a symbol to generate a signal</p>
    </div>
  )
}

/* ── Direction color helper ──────────────────────────────────────────────── */
function getDirectionColor(direction: 'BUY' | 'SELL' | 'NEUTRAL'): string {
  if (direction === 'BUY') return '#10b981'
  if (direction === 'SELL') return '#f43f5e'
  return '#a1a1aa'
}

function getGlowClass(direction: 'BUY' | 'SELL' | 'NEUTRAL'): string {
  if (direction === 'BUY') return 'glow-buy'
  if (direction === 'SELL') return 'glow-sell'
  return ''
}

function DirectionIcon({ direction }: { direction: 'BUY' | 'SELL' | 'NEUTRAL' }) {
  if (direction === 'BUY') return <TrendingUp size={14} />
  if (direction === 'SELL') return <TrendingDown size={14} />
  return <Minus size={14} />
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function SignalPanel({ symbol, mode, risk, loading = false }: SignalPanelProps) {
  const { signal: liveSignal, loading: signalLoading } = useSignals(symbol, mode, risk)

  if (loading || signalLoading) return <SignalPanelSkeleton />
  if (!symbol) return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <EmptyState />
    </div>
  )

  const mockSig = buildSignal(symbol, mode, risk)
  const direction = liveSignal?.direction ?? mockSig.direction
  const confidence = liveSignal?.confidence ?? mockSig.confidence
  const technicals = liveSignal?.technicals ?? mockSig.technicals
  const reason = liveSignal?.reason ?? mockSig.reason

  const entryPrice = mockSig.entryPrice
  const stopLoss = mockSig.stopLoss
  const tp1 = mockSig.tp1
  const tp2 = mockSig.tp2
  const tp3 = mockSig.tp3

  const dirColor = getDirectionColor(direction)
  const slDistance = Math.abs(entryPrice - stopLoss)
  const rrRatio = (Math.abs(tp1 - entryPrice) / slDistance).toFixed(2)
  const totalTechCount = Object.keys(technicals).length
  const agreingCount = Object.values(technicals).filter(Boolean).length
  const glowClass = getGlowClass(direction)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4 sm:p-5 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${glowClass} ${direction !== 'NEUTRAL' ? 'signal-alive' : ''}`}
      style={{ borderTopColor: dirColor, borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Signal Panel</h3>
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold tracking-widest transition-all duration-300"
              style={{
                backgroundColor: `${dirColor}1a`,
                color: dirColor,
                border: `1px solid ${dirColor}40`,
                boxShadow: `0 0 8px ${dirColor}25`,
              }}
            >
              <DirectionIcon direction={direction} />
              {direction}
            </span>
            {liveSignal && (
              <span className="flex items-center gap-1">
                <Radio size={10} className="text-emerald-500 animate-pulse" />
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">LIVE</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-600 truncate">
            {symbol} · {mode.charAt(0).toUpperCase() + mode.slice(1)} · now
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: dirColor, boxShadow: `0 0 6px ${dirColor}` }}
              aria-hidden="true"
            />
            <ShareSignal
              symbol={symbol}
              direction={direction}
              confidence={confidence}
              mode={mode}
              risk={risk}
              entryPrice={entryPrice}
              technicals={technicals}
              reason={reason}
            />
          </div>
          <span className="text-[10px] text-zinc-600 whitespace-nowrap">
            {agreingCount}/{totalTechCount} signals
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Confidence</span>
        </div>
        <ConfidenceBar value={confidence} />
      </div>

      {/* Reason */}
      <div className="mt-3 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Analysis</span>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{reason}</p>
      </div>

      {/* Technical indicators */}
      <div className="mt-4">
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-600">
          Signal Agreement
        </span>
        <div className="flex flex-wrap gap-2">
          <TechBadge label="RSI" active={technicals.rsi} />
          <TechBadge label="MACD" active={technicals.macd} />
          <TechBadge label="EMA" active={technicals.ema} />
          <TechBadge label="S/R" active={technicals.sr} />
          <TechBadge label="BB" active={technicals.bollinger ?? false} />
          <TechBadge label="Stoch" active={technicals.stochastic ?? false} />
        </div>
      </div>

      {/* Price levels */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-widest text-zinc-600">Entry &amp; Targets</span>
          <PriceRow label="Entry" value={fmt(symbol, entryPrice)} color="#e4e4e7" />
          <PriceRow label="TP1" value={fmt(symbol, tp1)} color="#10b981" tag="1.618" />
          <PriceRow label="TP2" value={fmt(symbol, tp2)} color="#10b981" tag="2.618" />
          <PriceRow label="TP3" value={fmt(symbol, tp3)} color="#10b981" tag="4.236" />
        </div>

        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-widest text-zinc-600">Risk Management</span>
          <PriceRow
            label="Stop Loss"
            value={fmt(symbol, stopLoss)}
            color="#f43f5e"
            tag={fmtPips(symbol, slDistance)}
          />

          {/* R:R display */}
          <div className="rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Risk / Reward</span>
              <span className="font-mono text-xs font-bold text-emerald-500 tabular-nums">1 : {rrRatio}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full bg-rose-500" style={{ width: '20%' }} />
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.min(80, 20 * parseFloat(rrRatio))}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[9px] text-rose-500">Risk 1x</span>
              <span className="text-[9px] text-emerald-500">Reward {rrRatio}x</span>
            </div>
          </div>

          {/* Mode info */}
          <div className="rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">Mode</span>
              <span className="text-[10px] font-semibold capitalize text-zinc-400">{mode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">Risk Profile</span>
              <span
                className="text-[10px] font-semibold capitalize"
                style={{
                  color: risk === 'conservative' ? '#10b981' : risk === 'balanced' ? '#a1a1aa' : '#f43f5e',
                }}
              >
                {risk}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
