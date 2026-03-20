'use client'

import { useState } from 'react'
import { useIndicators } from '../hooks/useIndicators'
import { fmt } from '../data/mockSignals'
import type { AllIndicators, BollingerBands, StochasticResult } from '../lib/technicalAnalysis'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface IndicatorsPanelProps {
  symbol: string
}

/* ── Badge helper ─────────────────────────────────────────────────────────── */

type Sentiment = 'bullish' | 'bearish' | 'neutral'

function Badge({ sentiment }: { sentiment: Sentiment }) {
  const styles: Record<Sentiment, { bg: string; text: string; label: string }> = {
    bullish: { bg: '#10b98118', text: '#10b981', label: 'Bullish' },
    bearish: { bg: '#f43f5e18', text: '#f43f5e', label: 'Bearish' },
    neutral: { bg: '#6b728018', text: '#9ca3af', label: 'Neutral' },
  }
  const s = styles[sentiment]
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

/* ── RSI Gauge ────────────────────────────────────────────────────────────── */

function RSIGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped < 30 ? '#10b981' : clamped > 70 ? '#f43f5e' : '#6b7280'
  const sentiment: Sentiment = clamped < 30 ? 'bullish' : clamped > 70 ? 'bearish' : 'neutral'
  const label = clamped < 30 ? 'Oversold' : clamped > 70 ? 'Overbought' : 'Neutral'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">RSI</span>
          <span className="text-[10px] text-zinc-600">14-period</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">{label}</span>
          <Badge sentiment={sentiment} />
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
        {/* Zones */}
        <div className="absolute inset-0 flex">
          <div className="h-full" style={{ width: '30%', backgroundColor: '#10b98110' }} />
          <div className="h-full" style={{ width: '40%', backgroundColor: '#6b728010' }} />
          <div className="h-full flex-1" style={{ backgroundColor: '#f43f5e10' }} />
        </div>
        {/* Zone dividers */}
        <div className="absolute inset-y-0" style={{ left: '30%', width: '1px', backgroundColor: '#333' }} />
        <div className="absolute inset-y-0" style={{ left: '70%', width: '1px', backgroundColor: '#333' }} />
        {/* Indicator needle */}
        <div
          className="absolute top-0 h-full w-1 rounded-full transition-all duration-700"
          style={{ left: `calc(${clamped}% - 2px)`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[9px] text-zinc-700">
        <span>0</span>
        <span className="text-[#10b981]">30</span>
        <span>50</span>
        <span className="text-[#f43f5e]">70</span>
        <span>100</span>
      </div>

      {/* Numeric value */}
      <div className="text-right">
        <span className="font-mono text-xl font-bold" style={{ color }}>
          {clamped.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

/* ── MACD Display ─────────────────────────────────────────────────────────── */

function MACDDisplay({
  macd,
}: {
  macd: AllIndicators['macd']
}) {
  const { macdLine, signalLine, histogram } = macd
  const isBullish = macdLine > signalLine
  const histColor = histogram > 0 ? '#10b981' : '#f43f5e'
  const sentiment: Sentiment = isBullish ? 'bullish' : 'bearish'
  const crossoverLabel = isBullish ? 'Bullish Crossover' : 'Bearish Crossover'

  const fmt6 = (v: number) => {
    if (!isFinite(v)) return 'N/A'
    const abs = Math.abs(v)
    if (abs >= 1000) return v.toFixed(0)
    if (abs >= 100) return v.toFixed(1)
    if (abs >= 10) return v.toFixed(2)
    if (abs >= 1) return v.toFixed(3)
    return v.toFixed(5)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">MACD</span>
          <span className="text-[10px] text-zinc-600">12 / 26 / 9</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{crossoverLabel}</span>
          <Badge sentiment={sentiment} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* MACD Line */}
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">MACD</div>
          <div
            className="font-mono text-sm font-bold"
            style={{ color: macdLine >= 0 ? '#10b981' : '#f43f5e' }}
          >
            {fmt6(macdLine)}
          </div>
        </div>

        {/* Signal Line */}
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Signal</div>
          <div className="font-mono text-sm font-bold text-zinc-300">{fmt6(signalLine)}</div>
        </div>

        {/* Histogram */}
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Hist</div>
          <div className="font-mono text-sm font-bold" style={{ color: histColor }}>
            {fmt6(histogram)}
          </div>
        </div>
      </div>

      {/* Histogram bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.abs(histogram / (Math.abs(macdLine) || 1)) * 50 + 50)}%`,
              backgroundColor: histColor,
              opacity: 0.7,
            }}
          />
        </div>
        <span className="text-[9px] text-zinc-600 flex-shrink-0">
          {histogram > 0 ? '▲' : '▼'} momentum
        </span>
      </div>
    </div>
  )
}

/* ── EMA Display ──────────────────────────────────────────────────────────── */

function EMADisplay({
  symbol,
  currentPrice,
  ema20,
  ema50,
  ema200,
}: {
  symbol: string
  currentPrice: number
  ema20: number
  ema50: number
  ema200: number
}) {
  const bullishAlignment =
    isFinite(currentPrice) &&
    isFinite(ema20) &&
    isFinite(ema50) &&
    isFinite(ema200) &&
    currentPrice > ema20 &&
    ema20 > ema50 &&
    ema50 > ema200

  const bearishAlignment =
    isFinite(currentPrice) &&
    isFinite(ema20) &&
    isFinite(ema50) &&
    isFinite(ema200) &&
    currentPrice < ema20 &&
    ema20 < ema50 &&
    ema50 < ema200

  const alignmentSentiment: Sentiment = bullishAlignment
    ? 'bullish'
    : bearishAlignment
    ? 'bearish'
    : 'neutral'

  const alignmentLabel = bullishAlignment
    ? 'Bullish Alignment'
    : bearishAlignment
    ? 'Bearish Alignment'
    : 'Mixed Alignment'

  const emaRows: { label: string; value: number; abovePrice: boolean }[] = [
    { label: 'EMA 20', value: ema20, abovePrice: isFinite(ema20) && ema20 > currentPrice },
    { label: 'EMA 50', value: ema50, abovePrice: isFinite(ema50) && ema50 > currentPrice },
    { label: 'EMA 200', value: ema200, abovePrice: isFinite(ema200) && ema200 > currentPrice },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">EMA</span>
          <span className="text-[10px] text-zinc-600">20 / 50 / 200</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{alignmentLabel}</span>
          <Badge sentiment={alignmentSentiment} />
        </div>
      </div>

      <div className="space-y-1.5">
        {emaRows.map(({ label, value, abovePrice }) => {
          const positionColor = abovePrice ? '#f43f5e' : '#10b981'
          const positionLabel = abovePrice ? 'above price' : 'below price'
          return (
            <div
              key={label}
              className="flex items-center justify-between rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: positionColor }}
                  aria-hidden="true"
                />
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isFinite(value) ? (
                  <>
                    <span className="text-[9px] text-zinc-600">{positionLabel}</span>
                    <span className="font-mono text-xs font-bold text-gray-200">
                      {fmt(symbol, value)}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] text-zinc-700">Insufficient data</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current price reference */}
      <div className="flex items-center gap-2 border-t border-[#222] pt-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Current</span>
        <span className="font-mono text-sm font-bold text-white">{fmt(symbol, currentPrice)}</span>
        {bullishAlignment && (
          <span className="text-[10px] text-[#10b981]">· price above all EMAs ↑</span>
        )}
        {bearishAlignment && (
          <span className="text-[10px] text-[#f43f5e]">· price below all EMAs ↓</span>
        )}
      </div>
    </div>
  )
}

/* ── Bollinger Bands Display ───────────────────────────────────────────────── */

function BollingerDisplay({
  symbol,
  bollinger,
  currentPrice,
}: {
  symbol: string
  bollinger: BollingerBands
  currentPrice: number
}) {
  const { upper, middle, lower, bandwidth, percentB } = bollinger
  const isNearUpper = percentB > 0.8
  const isNearLower = percentB < 0.2
  const sentiment: Sentiment = isNearLower ? 'bullish' : isNearUpper ? 'bearish' : 'neutral'
  const posLabel = isNearLower
    ? 'Near Lower Band'
    : isNearUpper
    ? 'Near Upper Band'
    : 'Mid Range'

  const pctBClamped = Math.max(0, Math.min(1, percentB))
  const pctColor = percentB < 0.2 ? '#10b981' : percentB > 0.8 ? '#f43f5e' : '#6b7280'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Bollinger Bands</span>
          <span className="text-[10px] text-zinc-600">20, 2σ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{posLabel}</span>
          <Badge sentiment={sentiment} />
        </div>
      </div>

      {/* Band values */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Upper</div>
          <div className="font-mono text-sm font-bold text-[#f43f5e]">
            {fmt(symbol, upper)}
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Middle</div>
          <div className="font-mono text-sm font-bold text-zinc-300">
            {fmt(symbol, middle)}
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Lower</div>
          <div className="font-mono text-sm font-bold text-[#10b981]">
            {fmt(symbol, lower)}
          </div>
        </div>
      </div>

      {/* %B gauge */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">%B Position</span>
          <span className="font-mono text-xs font-bold" style={{ color: pctColor }}>
            {(percentB * 100).toFixed(1)}%
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="h-full" style={{ width: '20%', backgroundColor: '#10b98110' }} />
            <div className="h-full" style={{ width: '60%', backgroundColor: '#6b728010' }} />
            <div className="h-full flex-1" style={{ backgroundColor: '#f43f5e10' }} />
          </div>
          <div className="absolute inset-y-0" style={{ left: '20%', width: '1px', backgroundColor: '#333' }} />
          <div className="absolute inset-y-0" style={{ left: '80%', width: '1px', backgroundColor: '#333' }} />
          <div
            className="absolute top-0 h-full w-1 rounded-full transition-all duration-700"
            style={{ left: `calc(${pctBClamped * 100}% - 2px)`, backgroundColor: pctColor, boxShadow: `0 0 6px ${pctColor}` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-zinc-700">
          <span className="text-[#10b981]">Oversold</span>
          <span>Bandwidth: {(bandwidth * 100).toFixed(2)}%</span>
          <span className="text-[#f43f5e]">Overbought</span>
        </div>
      </div>
    </div>
  )
}

/* ── Stochastic Display ───────────────────────────────────────────────────── */

function StochasticDisplay({ stochastic }: { stochastic: StochasticResult }) {
  const { k, d } = stochastic
  const isOversold = k < 20
  const isOverbought = k > 80
  const isBullishCross = k > d
  const sentiment: Sentiment = isOversold ? 'bullish' : isOverbought ? 'bearish' : 'neutral'
  const crossLabel = isBullishCross ? 'Bullish Cross' : 'Bearish Cross'

  const kClamped = Math.max(0, Math.min(100, k))
  const dClamped = Math.max(0, Math.min(100, d))
  const kColor = isOversold ? '#10b981' : isOverbought ? '#f43f5e' : '#6b7280'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Stochastic</span>
          <span className="text-[10px] text-zinc-600">14, 3, 3</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{crossLabel}</span>
          <Badge sentiment={sentiment} />
        </div>
      </div>

      {/* %K and %D values */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">%K</div>
          <div className="font-mono text-xl font-bold" style={{ color: kColor }}>
            {k.toFixed(1)}
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">%D</div>
          <div className="font-mono text-xl font-bold text-zinc-300">
            {d.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Gauge */}
      <div className="relative h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="h-full" style={{ width: '20%', backgroundColor: '#10b98110' }} />
          <div className="h-full" style={{ width: '60%', backgroundColor: '#6b728010' }} />
          <div className="h-full flex-1" style={{ backgroundColor: '#f43f5e10' }} />
        </div>
        <div className="absolute inset-y-0" style={{ left: '20%', width: '1px', backgroundColor: '#333' }} />
        <div className="absolute inset-y-0" style={{ left: '80%', width: '1px', backgroundColor: '#333' }} />
        {/* %D marker */}
        <div
          className="absolute top-0 h-full w-1 rounded-full transition-all duration-700 opacity-50"
          style={{ left: `calc(${dClamped}% - 2px)`, backgroundColor: '#9ca3af' }}
        />
        {/* %K marker */}
        <div
          className="absolute top-0 h-full w-1 rounded-full transition-all duration-700"
          style={{ left: `calc(${kClamped}% - 2px)`, backgroundColor: kColor, boxShadow: `0 0 6px ${kColor}` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-zinc-700">
        <span>0</span>
        <span className="text-[#10b981]">20</span>
        <span>50</span>
        <span className="text-[#f43f5e]">80</span>
        <span>100</span>
      </div>
    </div>
  )
}

/* ── Shimmer skeleton ─────────────────────────────────────────────────────── */

function SkeletonRow() {
  return <div className="h-10 rounded-md bg-[#1a1a1a] animate-pulse" />
}

/* ── Main component ───────────────────────────────────────────────────────── */

export default function IndicatorsPanel({ symbol }: IndicatorsPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { indicators, loading, error } = useIndicators(symbol)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="rounded-xl border border-white/[0.06] bg-[#111] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ borderTopColor: '#10b981', borderTopWidth: '2px' }}
    >
      {/* Collapsible header */}
      <button
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-4 hover:bg-[#1a1a1a] transition-colors rounded-t-lg"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Technical Indicators</h3>
          <span className="hidden sm:inline text-xs text-zinc-600">
            · {symbol} · RSI · MACD · EMA · BB · Stoch
          </span>
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
        <div className="border-t border-[#222] px-4 pb-4 sm:px-5 sm:pb-5">
          {/* Loading shimmer */}
          {loading && (
            <div className="flex flex-col gap-3 pt-4">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="mt-4 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-3 text-xs text-zinc-500">
              Unable to load indicators · {error}
            </div>
          )}

          {/* Data */}
          {!loading && !error && indicators && (
            <div className="mt-4 space-y-5">
              {/* RSI */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                {isFinite(indicators.rsi) ? (
                  <RSIGauge value={indicators.rsi} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-300">RSI</span>
                      <Badge sentiment="neutral" />
                    </div>
                    <p className="text-[10px] text-zinc-600">Insufficient price history</p>
                  </div>
                )}
              </div>

              {/* MACD */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                {isFinite(indicators.macd.macdLine) ? (
                  <MACDDisplay macd={indicators.macd} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-300">MACD</span>
                      <Badge sentiment="neutral" />
                    </div>
                    <p className="text-[10px] text-zinc-600">Insufficient price history</p>
                  </div>
                )}
              </div>

              {/* EMA */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                <EMADisplay
                  symbol={symbol}
                  currentPrice={indicators.currentPrice}
                  ema20={indicators.ema20}
                  ema50={indicators.ema50}
                  ema200={indicators.ema200}
                />
              </div>

              {/* Bollinger Bands */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                {indicators.bollinger && isFinite(indicators.bollinger.upper) ? (
                  <BollingerDisplay
                    symbol={symbol}
                    bollinger={indicators.bollinger}
                    currentPrice={indicators.currentPrice}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-300">Bollinger Bands</span>
                      <Badge sentiment="neutral" />
                    </div>
                    <p className="text-[10px] text-zinc-600">Insufficient price history</p>
                  </div>
                )}
              </div>

              {/* Stochastic Oscillator */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                {indicators.stochastic && isFinite(indicators.stochastic.k) ? (
                  <StochasticDisplay stochastic={indicators.stochastic} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-300">Stochastic</span>
                      <Badge sentiment="neutral" />
                    </div>
                    <p className="text-[10px] text-zinc-600">Insufficient price history</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
