'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Candle } from '../lib/supportResistance'
import type { SRLevel } from '../lib/supportResistance'

interface TooltipData {
  x: number
  y: number
  candle: Candle
}

interface IndicatorOverlay {
  ema20: number[]
  ema50: number[]
  ema200: number[]
}

interface SignalMarker {
  index: number
  direction: 'BUY' | 'SELL'
}

/* ── Fetch helpers (client-side) ────────────────────────────────────────────── */

async function fetchCandles(symbol: string): Promise<Candle[]> {
  const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.candles as Candle[]
}

async function fetchSRLevels(symbol: string): Promise<{ support: SRLevel[]; resistance: SRLevel[] }> {
  const res = await fetch(`/api/sr?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) return { support: [], resistance: [] }
  const data = await res.json()
  return { support: data.support ?? [], resistance: data.resistance ?? [] }
}

async function fetchIndicatorSeries(
  candles: Candle[],
): Promise<IndicatorOverlay> {
  const { computeEMA } = await import('../lib/technicalAnalysis')
  const closes = candles.map((c) => c.close)

  const ema20: number[] = []
  const ema50: number[] = []
  const ema200: number[] = []

  for (let i = 1; i <= closes.length; i++) {
    ema20.push(computeEMA(closes.slice(0, i), 20))
    ema50.push(computeEMA(closes.slice(0, i), 50))
    ema200.push(computeEMA(closes.slice(0, i), 200))
  }

  return { ema20, ema50, ema200 }
}

/* ── Canvas drawing ─────────────────────────────────────────────────────────── */

function drawChart(
  canvas: HTMLCanvasElement,
  candles: Candle[],
  indicators: IndicatorOverlay | null,
  srLevels: { support: SRLevel[]; resistance: SRLevel[] },
  markers: SignalMarker[],
  tooltip: { candleIndex: number } | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const DPR = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const W = rect.width
  const H = rect.height

  canvas.width = W * DPR
  canvas.height = H * DPR
  ctx.scale(DPR, DPR)

  const DISPLAY = 50
  const displayCandles = candles.slice(-DISPLAY)
  const displayStart = candles.length - displayCandles.length

  if (displayCandles.length === 0) return

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  const pad = { top: 20, right: 16, bottom: 32, left: 64 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  // Price range
  const highs = displayCandles.map((c) => c.high)
  const lows = displayCandles.map((c) => c.low)
  const minP = Math.min(...lows) * 0.999
  const maxP = Math.max(...highs) * 1.001
  const priceRange = maxP - minP || 1

  const toX = (i: number) =>
    pad.left + (i / (displayCandles.length - 1 || 1)) * chartW

  const toY = (price: number) =>
    pad.top + chartH - ((price - minP) / priceRange) * chartH

  const candleW = Math.max(2, (chartW / displayCandles.length) * 0.6)

  // Grid lines
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 0.5
  for (let g = 0; g <= 4; g++) {
    const y = pad.top + (g / 4) * chartH
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(W - pad.right, y)
    ctx.stroke()

    const val = maxP - (g / 4) * priceRange
    ctx.fillStyle = '#4b5563'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'

    // Format based on price magnitude
    const decimals = val >= 1000 ? 0 : val >= 1 ? 2 : 4
    ctx.fillText(val.toFixed(decimals), pad.left - 4, y + 3)
  }

  // S/R levels (dashed horizontal lines)
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 0.7
  for (const s of srLevels.support) {
    if (s.price >= minP && s.price <= maxP) {
      ctx.strokeStyle = '#10b98180'
      ctx.beginPath()
      ctx.moveTo(pad.left, toY(s.price))
      ctx.lineTo(W - pad.right, toY(s.price))
      ctx.stroke()
    }
  }
  for (const r of srLevels.resistance) {
    if (r.price >= minP && r.price <= maxP) {
      ctx.strokeStyle = '#f43f5e80'
      ctx.beginPath()
      ctx.moveTo(pad.left, toY(r.price))
      ctx.lineTo(W - pad.right, toY(r.price))
      ctx.stroke()
    }
  }
  ctx.setLineDash([])

  // EMA lines
  if (indicators) {
    const drawEMA = (series: number[], color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'
      ctx.beginPath()
      let started = false
      for (let i = 0; i < displayCandles.length; i++) {
        const absIdx = displayStart + i
        const v = series[absIdx]
        if (isNaN(v)) continue
        const x = toX(i)
        const y = toY(v)
        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }

    drawEMA(indicators.ema20, '#eab30880')   // yellow, semi-transparent
    drawEMA(indicators.ema50, '#10b98180')   // blue
    drawEMA(indicators.ema200, '#a855f780')  // purple
  }

  // Candlesticks
  for (let i = 0; i < displayCandles.length; i++) {
    const c = displayCandles[i]
    const x = toX(i)
    const isUp = c.close >= c.open
    const color = isUp ? '#10b981' : '#f43f5e'
    const isHovered = tooltip?.candleIndex === i

    ctx.strokeStyle = color
    ctx.lineWidth = isHovered ? 1.5 : 0.8

    // Wick
    ctx.beginPath()
    ctx.moveTo(x, toY(c.high))
    ctx.lineTo(x, toY(c.low))
    ctx.stroke()

    // Body
    const bodyTop = toY(Math.max(c.open, c.close))
    const bodyBot = toY(Math.min(c.open, c.close))
    const bodyH = Math.max(1, bodyBot - bodyTop)

    if (isUp) {
      ctx.fillStyle = isHovered ? '#10b981' : '#10b98180'
    } else {
      ctx.fillStyle = isHovered ? '#f43f5e' : '#f43f5e80'
    }
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
  }

  // Signal markers (triangles)
  for (const marker of markers) {
    const relIdx = marker.index - displayStart
    if (relIdx < 0 || relIdx >= displayCandles.length) continue
    const c = displayCandles[relIdx]
    const x = toX(relIdx)

    if (marker.direction === 'BUY') {
      const baseY = toY(c.low) + 10
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.moveTo(x, baseY - 8)
      ctx.lineTo(x - 5, baseY)
      ctx.lineTo(x + 5, baseY)
      ctx.closePath()
      ctx.fill()
    } else {
      const baseY = toY(c.high) - 10
      ctx.fillStyle = '#f43f5e'
      ctx.beginPath()
      ctx.moveTo(x, baseY + 8)
      ctx.lineTo(x - 5, baseY)
      ctx.lineTo(x + 5, baseY)
      ctx.closePath()
      ctx.fill()
    }
  }

  // X-axis date labels
  ctx.fillStyle = '#4b5563'
  ctx.font = '8px monospace'
  ctx.textAlign = 'center'
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
  const labelIdxs = [0, Math.floor(displayCandles.length / 2), displayCandles.length - 1]
  for (const li of labelIdxs) {
    if (li < displayCandles.length) {
      ctx.fillText(fmtDate(displayCandles[li].time), toX(li), H - 10)
    }
  }

  // Tooltip highlight
  if (tooltip !== null) {
    const c = displayCandles[tooltip.candleIndex]
    if (c) {
      const x = toX(tooltip.candleIndex)
      ctx.strokeStyle = '#ffffff20'
      ctx.lineWidth = 0.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, H - pad.bottom)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
}

/* ── Main component ─────────────────────────────────────────────────────────── */

interface PriceChartProps {
  symbol: string
}

export default function PriceChart({ symbol }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [indicators, setIndicators] = useState<IndicatorOverlay | null>(null)
  const [srLevels, setSRLevels] = useState<{ support: SRLevel[]; resistance: SRLevel[] }>({
    support: [],
    resistance: [],
  })
  const [markers] = useState<SignalMarker[]>([])
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const ACCENT = '#06b6d4'
  const DISPLAY = 50

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [c, sr] = await Promise.all([fetchCandles(symbol), fetchSRLevels(symbol)])
      setCandles(c)
      setSRLevels(sr)
      const ind = await fetchIndicatorSeries(c)
      setIndicators(ind)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    load()
  }, [load])

  // Redraw on data/tooltip change
  useEffect(() => {
    if (canvasRef.current && candles.length > 0) {
      drawChart(
        canvasRef.current,
        candles,
        indicators,
        srLevels,
        markers,
        hoveredIndex !== null ? { candleIndex: hoveredIndex } : null,
      )
    }
  }, [candles, indicators, srLevels, markers, hoveredIndex])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (candles.length === 0) return
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const W = rect.width
      const DISPLAY_N = Math.min(DISPLAY, candles.length)
      const displayCandles = candles.slice(-DISPLAY_N)
      const padLeft = 64
      const padRight = 16
      const chartW = W - padLeft - padRight

      const idx = Math.round(((x - padLeft) / chartW) * (displayCandles.length - 1))
      if (idx >= 0 && idx < displayCandles.length) {
        const c = displayCandles[idx]
        setHoveredIndex(idx)
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, candle: c })
      }
    },
    [candles],
  )

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setTooltip(null)
  }

  const lastCandle = candles[candles.length - 1]
  const priceColor = lastCandle
    ? lastCandle.close >= lastCandle.open
      ? '#10b981'
      : '#f43f5e'
    : '#6b7280'

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
          <h3 className="text-sm font-semibold text-white">
            {symbol} — Price Chart
          </h3>
          {lastCandle && (
            <span
              className="font-mono text-[10px] font-bold"
              style={{ color: priceColor }}
            >
              {lastCandle.close >= 1000
                ? lastCandle.close.toFixed(0)
                : lastCandle.close >= 1
                  ? lastCandle.close.toFixed(2)
                  : lastCandle.close.toFixed(4)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* EMA legend */}
          <div className="hidden sm:flex items-center gap-2 text-[8px] text-zinc-600">
            <span style={{ color: '#eab308' }}>— EMA20</span>
            <span style={{ color: '#10b981' }}>— EMA50</span>
            <span style={{ color: '#a855f7' }}>— EMA200</span>
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
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06]">
          {error ? (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[10px] text-[#f43f5e]">{error}</p>
              <button
                onClick={load}
                className="text-[9px] text-zinc-600 hover:text-zinc-400"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-[10px] text-zinc-600 animate-pulse">Loading chart…</div>
            </div>
          ) : (
            <div className="relative px-2 py-2">
              <canvas
                ref={canvasRef}
                className="w-full rounded-md border border-white/[0.06] cursor-crosshair"
                style={{ height: '300px', backgroundColor: '#0a0a0a' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="pointer-events-none absolute z-10 rounded border border-[#333] bg-[#111] px-2.5 py-1.5 text-[9px] font-mono shadow-lg"
                  style={{
                    left: Math.min(tooltip.x + 12, (canvasRef.current?.getBoundingClientRect().width ?? 300) - 120),
                    top: Math.max(4, tooltip.y - 60),
                  }}
                >
                  <div className="text-zinc-400 mb-1">
                    {new Date(tooltip.candle.time).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span className="text-zinc-600">O</span>
                    <span className="text-white">{tooltip.candle.open.toFixed(4)}</span>
                    <span className="text-zinc-600">H</span>
                    <span className="text-[#10b981]">{tooltip.candle.high.toFixed(4)}</span>
                    <span className="text-zinc-600">L</span>
                    <span className="text-[#f43f5e]">{tooltip.candle.low.toFixed(4)}</span>
                    <span className="text-zinc-600">C</span>
                    <span className="text-white">{tooltip.candle.close.toFixed(4)}</span>
                  </div>
                </div>
              )}

              {/* Legend for S/R */}
              <div className="mt-1 flex items-center gap-3 px-1 text-[8px]">
                <span className="flex items-center gap-1 text-zinc-700">
                  <span className="inline-block h-px w-4 border-t border-dashed border-[#10b98180]" />
                  Support
                </span>
                <span className="flex items-center gap-1 text-zinc-700">
                  <span className="inline-block h-px w-4 border-t border-dashed border-[#f43f5e80]" />
                  Resistance
                </span>
                <span className="flex items-center gap-1 text-zinc-700">
                  <span className="text-[#10b981]">▲</span> BUY
                </span>
                <span className="flex items-center gap-1 text-zinc-700">
                  <span className="text-[#f43f5e]">▼</span> SELL
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
