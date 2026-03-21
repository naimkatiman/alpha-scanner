'use client'

import { useState, useRef, useEffect } from 'react'
import type { EquitySnapshot, PerformanceMetrics } from '../hooks/usePerformanceAnalytics'

interface PerformanceAnalyticsProps {
  snapshots: EquitySnapshot[]
  metrics: PerformanceMetrics
  onReset: () => void
}

/* ── Canvas Equity Curve ──────────────────────────────────────────────────── */

function EquityCurve({ snapshots }: { snapshots: EquitySnapshot[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || snapshots.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const W = rect.width
    const H = rect.height

    canvas.width = W * DPR
    canvas.height = H * DPR
    ctx.scale(DPR, DPR)

    // Clear
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, W, H)

    const equities = snapshots.map((s) => s.equity)
    const minEq = Math.min(...equities) * 0.99
    const maxEq = Math.max(...equities) * 1.01
    const range = maxEq - minEq || 1

    const pad = { top: 20, right: 16, bottom: 28, left: 56 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    const toX = (i: number) => pad.left + (i / (snapshots.length - 1)) * chartW
    const toY = (v: number) => pad.top + chartH - ((v - minEq) / range) * chartH

    // Grid lines
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 0.5
    const gridLines = 4
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (i / gridLines) * chartH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(W - pad.right, y)
      ctx.stroke()

      // Labels
      const val = maxEq - (i / gridLines) * range
      ctx.fillStyle = '#4b5563'
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`$${val.toFixed(0)}`, pad.left - 4, y + 3)
    }

    // Drawdown fill
    let peak = equities[0]
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'
    ctx.beginPath()
    for (let i = 0; i < equities.length; i++) {
      if (equities[i] > peak) peak = equities[i]
      const x = toX(i)
      if (i === 0) ctx.moveTo(x, toY(peak))
      else ctx.lineTo(x, toY(peak))
    }
    for (let i = equities.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(i), toY(equities[i]))
    }
    ctx.closePath()
    ctx.fill()

    // Equity line
    const isUp = equities[equities.length - 1] >= equities[0]
    const lineColor = isUp ? '#10b981' : '#f43f5e'

    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < equities.length; i++) {
      const x = toX(i)
      const y = toY(equities[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom)
    gradient.addColorStop(0, `${lineColor}20`)
    gradient.addColorStop(1, `${lineColor}02`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    for (let i = 0; i < equities.length; i++) {
      const x = toX(i)
      const y = toY(equities[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.lineTo(toX(equities.length - 1), H - pad.bottom)
    ctx.lineTo(toX(0), H - pad.bottom)
    ctx.closePath()
    ctx.fill()

    // Current value dot
    const lastX = toX(equities.length - 1)
    const lastY = toY(equities[equities.length - 1])
    ctx.fillStyle = lineColor
    ctx.beginPath()
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2)
    ctx.stroke()

    // Date labels (first, middle, last)
    ctx.fillStyle = '#4b5563'
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    const fmtDate = (ts: number) =>
      new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
    if (snapshots.length >= 2) {
      ctx.fillText(fmtDate(snapshots[0].timestamp), toX(0), H - 8)
      if (snapshots.length > 2) {
        const midIdx = Math.floor(snapshots.length / 2)
        ctx.fillText(fmtDate(snapshots[midIdx].timestamp), toX(midIdx), H - 8)
      }
      ctx.fillText(fmtDate(snapshots[snapshots.length - 1].timestamp), toX(snapshots.length - 1), H - 8)
    }
  }, [snapshots])

  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 rounded-md border border-white/[0.06] bg-[#0a0a0a]">
        <div className="text-center">
          <div className="opacity-30 mb-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <p className="text-[10px] text-zinc-600">Not enough data for equity curve</p>
          <p className="text-[8px] text-zinc-700">Start paper trading to build history</p>
        </div>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-md border border-white/[0.06]"
      style={{ height: '160px', backgroundColor: '#0a0a0a' }}
    />
  )
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function PerformanceAnalytics({
  snapshots,
  metrics,
  onReset,
}: PerformanceAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [tab, setTab] = useState<'overview' | 'breakdown'>('overview')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const plColor = metrics.totalPL >= 0 ? '#10b981' : '#f43f5e'

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden"
      style={{ borderTopColor: '#f97316', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: '#f97316', boxShadow: '0 0 6px #f97316' }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Performance Analytics</h3>
          {metrics.totalPL !== 0 && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${plColor}18`,
                color: plColor,
              }}
            >
              {metrics.totalPL >= 0 ? '+' : ''}${metrics.totalPL.toFixed(2)}
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
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setTab('overview')}
              className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: tab === 'overview' ? '#f97316' : '#4b5563',
                borderBottom: tab === 'overview' ? '2px solid #f97316' : '2px solid transparent',
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('breakdown')}
              className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: tab === 'breakdown' ? '#f97316' : '#4b5563',
                borderBottom: tab === 'breakdown' ? '2px solid #f97316' : '2px solid transparent',
              }}
            >
              Breakdown
            </button>
          </div>

          {tab === 'overview' ? (
            <div className="px-4 py-4 sm:px-5 space-y-4">
              {/* Equity Curve */}
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                  Equity Curve
                </span>
                <EquityCurve snapshots={snapshots} />
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MetricCard
                  label="Total P&L"
                  value={`${metrics.totalPL >= 0 ? '+' : ''}$${metrics.totalPL.toFixed(2)}`}
                  sub={`${metrics.totalPLPct >= 0 ? '+' : ''}${metrics.totalPLPct.toFixed(1)}%`}
                  color={plColor}
                />
                <MetricCard
                  label="Max Drawdown"
                  value={`$${metrics.maxDrawdown.toFixed(2)}`}
                  sub={`${metrics.maxDrawdownPct.toFixed(1)}%`}
                  color="#f43f5e"
                />
                <MetricCard
                  label="Profit Factor"
                  value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
                  sub={metrics.profitFactor >= 1.5 ? 'Good' : metrics.profitFactor >= 1 ? 'Break-even' : 'Negative'}
                  color={metrics.profitFactor >= 1.5 ? '#10b981' : metrics.profitFactor >= 1 ? '#a1a1aa' : '#f43f5e'}
                />
                <MetricCard
                  label="Peak Equity"
                  value={`$${metrics.peakEquity.toFixed(0)}`}
                  sub={`Current: $${metrics.currentEquity.toFixed(0)}`}
                  color="#10b981"
                />
              </div>

              {/* Win/Loss stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MetricCard
                  label="Avg Win"
                  value={`$${metrics.avgWin.toFixed(2)}`}
                  sub={`Best: $${metrics.largestWin.toFixed(2)}`}
                  color="#10b981"
                />
                <MetricCard
                  label="Avg Loss"
                  value={`$${metrics.avgLoss.toFixed(2)}`}
                  sub={`Worst: $${Math.abs(metrics.largestLoss).toFixed(2)}`}
                  color="#f43f5e"
                />
                <MetricCard
                  label="Win Streak"
                  value={String(metrics.winStreak)}
                  sub={`Current: ${metrics.currentStreak > 0 ? `${metrics.currentStreak}W` : metrics.currentStreak < 0 ? `${Math.abs(metrics.currentStreak)}L` : '—'}`}
                  color="#10b981"
                />
                <MetricCard
                  label="Loss Streak"
                  value={String(metrics.lossStreak)}
                  sub="Consecutive"
                  color="#f43f5e"
                />
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 sm:px-5 space-y-4">
              {/* By Symbol */}
              {Object.keys(metrics.bySymbol).length > 0 ? (
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                    Profit by Symbol
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(metrics.bySymbol)
                      .sort(([, a], [, b]) => b.profit - a.profit)
                      .map(([symbol, data]) => (
                        <BreakdownBar
                          key={symbol}
                          label={symbol}
                          value={data.profit}
                          trades={data.trades}
                          maxValue={Math.max(
                            ...Object.values(metrics.bySymbol).map((d) => Math.abs(d.profit)),
                            1,
                          )}
                        />
                      ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="opacity-30 mb-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
                  <p className="text-xs text-zinc-500">No trade data yet</p>
                  <p className="text-[9px] text-zinc-700">Paper trade to see breakdown</p>
                </div>
              )}

              {/* By Mode */}
              {Object.keys(metrics.byMode).length > 0 && (
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                    Profit by Mode
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(metrics.byMode)
                      .sort(([, a], [, b]) => b.profit - a.profit)
                      .map(([mode, data]) => (
                        <BreakdownBar
                          key={mode}
                          label={mode}
                          value={data.profit}
                          trades={data.trades}
                          maxValue={Math.max(
                            ...Object.values(metrics.byMode).map((d) => Math.abs(d.profit)),
                            1,
                          )}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-[9px] text-zinc-700 hover:text-zinc-500 transition-colors"
              >
                Reset Analytics
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500">Clear all data?</span>
                <button
                  onClick={() => { onReset(); setShowResetConfirm(false) }}
                  className="text-[9px] text-[#f43f5e] font-semibold"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[9px] text-zinc-600"
                >
                  No
                </button>
              </div>
            )}
            <span className="text-[8px] text-zinc-700">
              {snapshots.length} snapshots
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-center">
      <span className="block text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">
        {label}
      </span>
      <span className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </span>
      <span className="block text-[8px] text-zinc-700 mt-0.5">{sub}</span>
    </div>
  )
}

function BreakdownBar({
  label,
  value,
  trades,
  maxValue,
}: {
  label: string
  value: number
  trades: number
  maxValue: number
}) {
  const color = value >= 0 ? '#10b981' : '#f43f5e'
  const pct = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0

  return (
    <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs font-semibold text-white capitalize w-20 truncate">{label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-[#222] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-[8px] text-zinc-600">{trades} trades</span>
        <span className="font-mono text-[10px] font-bold w-16 text-right" style={{ color }}>
          {value >= 0 ? '+' : ''}${value.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
