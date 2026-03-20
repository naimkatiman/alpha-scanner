'use client'

import { useState, useRef, useEffect } from 'react'
import { useBacktest } from '../hooks/useBacktest'
import { getAllSymbols, getSymbolConfig, fmt } from '../lib/symbols'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import type { BacktestTrade } from '../lib/backtestEngine'

/* ── Equity Curve Canvas ──────────────────────────────────────────────────── */

function EquityCurve({ data }: { data: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    canvas.width = W * DPR
    canvas.height = H * DPR
    ctx.scale(DPR, DPR)

    const PAD = { top: 20, right: 10, bottom: 25, left: 55 }
    const cW = W - PAD.left - PAD.right
    const cH = H - PAD.top - PAD.bottom

    const minVal = Math.min(...data) * 0.98
    const maxVal = Math.max(...data) * 1.02
    const range = maxVal - minVal || 1

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (cH * i) / 4
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(W - PAD.right, y)
      ctx.stroke()

      const val = maxVal - (range * i) / 4
      ctx.fillStyle = '#555'
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`$${val.toFixed(0)}`, PAD.left - 5, y + 3)
    }

    // Map data to canvas coords
    const toX = (i: number) => PAD.left + (i / (data.length - 1)) * cW
    const toY = (v: number) => PAD.top + ((maxVal - v) / range) * cH

    // Fill gradient
    const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + cH)
    const isPositive = data[data.length - 1] >= data[0]
    gradient.addColorStop(0, isPositive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)')
    gradient.addColorStop(1, 'rgba(10,10,10,0)')

    ctx.beginPath()
    ctx.moveTo(toX(0), toY(data[0]))
    for (let i = 1; i < data.length; i++) ctx.lineTo(toX(i), toY(data[i]))
    ctx.lineTo(toX(data.length - 1), PAD.top + cH)
    ctx.lineTo(toX(0), PAD.top + cH)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(toX(0), toY(data[0]))
    for (let i = 1; i < data.length; i++) ctx.lineTo(toX(i), toY(data[i]))
    ctx.strokeStyle = isPositive ? '#10b981' : '#f43f5e'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Start line
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, toY(10000))
    ctx.lineTo(W - PAD.right, toY(10000))
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#555'
    ctx.font = '8px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('Start $10k', PAD.left + 2, toY(10000) - 4)
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      className="h-[200px] w-full"
      style={{ display: 'block' }}
    />
  )
}

/* ── Metric Card ──────────────────────────────────────────────────────────── */

function MetricCard({ label, value, color = 'text-white', sub }: {
  label: string
  value: string
  color?: string
  sub?: string
}) {
  return (
    <div className="rounded border border-[#222] bg-[#1a1a1a] p-3">
      <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">{label}</div>
      <div className={`font-mono text-lg font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[9px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  )
}

/* ── Trades Table ─────────────────────────────────────────────────────────── */

function TradesTable({ trades, symbol }: { trades: BacktestTrade[]; symbol: string }) {
  if (trades.length === 0) {
    return <div className="text-center text-zinc-600 py-8 text-xs">No trades to display</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-[#222] text-zinc-500">
            <th className="px-2 py-2 text-left font-medium">#</th>
            <th className="px-2 py-2 text-left font-medium">Dir</th>
            <th className="px-2 py-2 text-right font-medium">Entry</th>
            <th className="px-2 py-2 text-right font-medium">Exit</th>
            <th className="px-2 py-2 text-right font-medium">P&L %</th>
            <th className="px-2 py-2 text-left font-medium">Exit</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(-20).reverse().map((t) => (
            <tr key={t.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
              <td className="px-2 py-1.5 text-zinc-500">{t.id}</td>
              <td className="px-2 py-1.5">
                <span className={`font-semibold ${t.direction === 'BUY' ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                  {t.direction}
                </span>
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-zinc-300">{fmt(symbol, t.entryPrice)}</td>
              <td className="px-2 py-1.5 text-right font-mono text-zinc-300">{fmt(symbol, t.exitPrice)}</td>
              <td className={`px-2 py-1.5 text-right font-mono font-semibold ${t.pnlPercent >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
              </td>
              <td className="px-2 py-1.5 text-zinc-500 uppercase">{t.exitReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function BacktestDashboard() {
  const [symbol, setSymbol] = useState('XAUUSD')
  const [mode, setMode] = useState<TradingMode>('swing')
  const [risk, setRisk] = useState<RiskProfile>('balanced')
  const [showTrades, setShowTrades] = useState(false)

  const { result, loading, error } = useBacktest(symbol, mode, risk)
  const allSymbols = getAllSymbols()
  const modes: TradingMode[] = ['swing', 'intraday', 'scalper']
  const risks: RiskProfile[] = ['conservative', 'balanced', 'high-risk']

  const config = getSymbolConfig(symbol)

  return (
    <div className="flex flex-col gap-4">
      {/* Selectors */}
      <div
        className="rounded-lg border border-[#222] bg-[#111] p-4"
        style={{ borderTopColor: '#f97316', borderTopWidth: '2px' }}
      >
        <div className="flex flex-wrap gap-3">
          {/* Symbol */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 block">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full rounded border border-[#222] bg-[#1a1a1a] px-3 py-2 text-xs text-white outline-none focus:border-[#f97316]/50"
            >
              {allSymbols.map((s) => (
                <option key={s.symbol} value={s.symbol}>{s.icon} {s.symbol} — {s.name}</option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 block">Mode</label>
            <div className="flex gap-1">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="rounded border px-3 py-2 text-[10px] font-semibold transition-all"
                  style={{
                    borderColor: mode === m ? 'rgba(249,115,22,0.5)' : '#222',
                    backgroundColor: mode === m ? 'rgba(249,115,22,0.1)' : '#1a1a1a',
                    color: mode === m ? '#fb923c' : '#6b7280',
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 block">Risk</label>
            <div className="flex gap-1">
              {risks.map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className="rounded border px-3 py-2 text-[10px] font-semibold transition-all"
                  style={{
                    borderColor: risk === r ? 'rgba(249,115,22,0.5)' : '#222',
                    backgroundColor: risk === r ? 'rgba(249,115,22,0.1)' : '#1a1a1a',
                    color: risk === r ? '#fb923c' : '#6b7280',
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-lg border border-[#222] bg-[#111] p-8 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent" />
          <p className="mt-2 text-xs text-zinc-500">Running backtest for {config?.icon} {symbol}...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#f43f5e]/30 bg-[#111] p-4 text-center text-xs text-[#f43f5e]">
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Total Trades"
              value={result.totalTrades.toString()}
              sub={`${result.wins}W / ${result.losses}L`}
            />
            <MetricCard
              label="Win Rate"
              value={`${result.winRate.toFixed(1)}%`}
              color={result.winRate >= 50 ? 'text-[#10b981]' : 'text-[#f43f5e]'}
            />
            <MetricCard
              label="Profit Factor"
              value={result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2)}
              color={result.profitFactor >= 1 ? 'text-[#10b981]' : 'text-[#f43f5e]'}
            />
            <MetricCard
              label="Max Drawdown"
              value={`${result.maxDrawdownPercent.toFixed(1)}%`}
              color="text-[#f43f5e]"
            />
            <MetricCard
              label="Total Return"
              value={`${result.totalReturnPercent >= 0 ? '+' : ''}${result.totalReturnPercent.toFixed(2)}%`}
              color={result.totalReturnPercent >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}
            />
            <MetricCard
              label="Avg R:R"
              value={result.avgRR === Infinity ? '∞' : result.avgRR.toFixed(2)}
              color="text-[#10b981]"
            />
            <MetricCard
              label="Best Trade"
              value={`+${result.bestTradePercent.toFixed(2)}%`}
              color="text-[#10b981]"
            />
            <MetricCard
              label="Worst Trade"
              value={`${result.worstTradePercent.toFixed(2)}%`}
              color="text-[#f43f5e]"
            />
          </div>

          {/* Equity Curve */}
          <div
            className="rounded-lg border border-[#222] bg-[#111] p-4"
            style={{ borderTopColor: '#f97316', borderTopWidth: '2px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
              <span className="font-mono text-xs text-zinc-500">
                $10,000 → ${result.equityCurve[result.equityCurve.length - 1]?.toFixed(0) ?? '10,000'}
              </span>
            </div>
            {result.equityCurve.length >= 2 ? (
              <EquityCurve data={result.equityCurve} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-600 text-xs">
                Not enough data for equity curve
              </div>
            )}
          </div>

          {/* Trades */}
          <div className="rounded-lg border border-[#222] bg-[#111]">
            <button
              onClick={() => setShowTrades(!showTrades)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Trade History</h3>
                <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                  {result.trades.length} trades
                </span>
              </div>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`text-zinc-500 transition-transform ${showTrades ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showTrades && (
              <div className="border-t border-[#222] p-4">
                <TradesTable trades={result.trades} symbol={symbol} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
