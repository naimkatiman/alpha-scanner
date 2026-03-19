'use client'

import { buildSignal, fmt, fmtPips } from '../data/mockSignals'
import type { TradingMode, RiskProfile } from '../data/mockSignals'

interface SignalPanelProps {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#3b82f6' : value >= 65 ? '#14b8a6' : '#f59e0b'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[--color-border]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

function TechBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded border px-2 py-1"
      style={{
        borderColor: active ? 'rgba(59,130,246,0.4)' : 'var(--color-border)',
        backgroundColor: active ? 'rgba(59,130,246,0.08)' : 'var(--color-card-alt)',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: active ? '#3b82f6' : '#374151' }}
      />
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
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
    <div className="flex items-center justify-between rounded border border-[--color-border] bg-[--color-card-alt] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{label}</span>
        {tag && (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {tag}
          </span>
        )}
      </div>
      <span className="font-mono text-xs font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function SignalPanel({ symbol, mode, risk }: SignalPanelProps) {
  const sig = buildSignal(symbol, mode, risk)
  const isBuy = sig.direction === 'BUY'
  const dirColor = isBuy ? '#3b82f6' : '#ef4444'
  const slDistance = Math.abs(sig.entryPrice - sig.stopLoss)
  const rrRatio = (Math.abs(sig.tp1 - sig.entryPrice) / slDistance).toFixed(2)
  const agreingCount = Object.values(sig.technicals).filter(Boolean).length

  return (
    <div
      className="rounded-lg border border-[--color-border] bg-[--color-card] p-5"
      style={{ borderTopColor: dirColor, borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Signal Panel</h3>
            {/* Direction badge */}
            <span
              className="rounded px-2 py-0.5 text-xs font-bold tracking-widest"
              style={{ backgroundColor: `${dirColor}1a`, color: dirColor, border: `1px solid ${dirColor}40` }}
            >
              {sig.direction}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {symbol} · {mode.charAt(0).toUpperCase() + mode.slice(1)} · {sig.timestamp}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: dirColor, boxShadow: `0 0 6px ${dirColor}` }}
          />
          <span className="text-[10px] text-gray-600">
            {agreingCount}/4 signals
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-gray-600">Confidence</span>
        </div>
        <ConfidenceBar value={sig.confidence} />
      </div>

      {/* Technical indicators */}
      <div className="mt-4">
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-gray-600">
          Signal Agreement
        </span>
        <div className="flex flex-wrap gap-2">
          <TechBadge label="RSI" active={sig.technicals.rsi} />
          <TechBadge label="MACD" active={sig.technicals.macd} />
          <TechBadge label="EMA" active={sig.technicals.ema} />
          <TechBadge label="S/R" active={sig.technicals.sr} />
        </div>
      </div>

      {/* Price levels */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-widest text-gray-600">Entry & Targets</span>
          <PriceRow label="Entry" value={fmt(symbol, sig.entryPrice)} color="#e5e7eb" />
          <PriceRow label="TP1" value={fmt(symbol, sig.tp1)} color="#14b8a6" tag="1.618" />
          <PriceRow label="TP2" value={fmt(symbol, sig.tp2)} color="#3b82f6" tag="2.618" />
          <PriceRow label="TP3" value={fmt(symbol, sig.tp3)} color="#818cf8" tag="4.236" />
        </div>

        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-widest text-gray-600">Risk Management</span>
          <PriceRow
            label="Stop Loss"
            value={fmt(symbol, sig.stopLoss)}
            color="#ef4444"
            tag={fmtPips(symbol, slDistance)}
          />

          {/* R:R display */}
          <div className="rounded border border-[--color-border] bg-[--color-card-alt] px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Risk / Reward</span>
              <span className="font-mono text-xs font-bold text-[#14b8a6]">1 : {rrRatio}</span>
            </div>
            {/* Visual RR bar */}
            <div className="flex h-1.5 overflow-hidden rounded-full bg-[--color-border]">
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
          <div className="rounded border border-[--color-border-subtle] bg-[--color-card-alt] px-3 py-2">
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
