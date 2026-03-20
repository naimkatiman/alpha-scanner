/* ── Signal Generation Engine ─────────────────────────────────────────────── */
// Produces BUY / SELL / NEUTRAL signals from real indicator + S/R data.
// Pure functions — no side effects.

import type { TradingMode, RiskProfile } from '../data/mockSignals'
import type { AllIndicators } from './technicalAnalysis'
import type { SRLevel } from './supportResistance'

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SignalDirection = 'BUY' | 'SELL' | 'NEUTRAL'

export interface GeneratedSignal {
  direction: SignalDirection
  confidence: number
  technicals: { rsi: boolean; macd: boolean; ema: boolean; sr: boolean }
  reason: string
}

interface IndicatorScore {
  score: number // +1 BUY, -1 SELL, 0 NEUTRAL
  label: string // human-readable reason fragment
}

/* ── RSI thresholds per mode ─────────────────────────────────────────────── */

const RSI_THRESHOLDS: Record<TradingMode, { oversold: number; overbought: number }> = {
  swing: { oversold: 25, overbought: 75 },
  intraday: { oversold: 30, overbought: 70 },
  scalper: { oversold: 35, overbought: 65 },
}

/* ── Per-indicator scoring ───────────────────────────────────────────────── */

function scoreRSI(rsi: number, mode: TradingMode): IndicatorScore {
  const { oversold, overbought } = RSI_THRESHOLDS[mode]
  if (isNaN(rsi)) return { score: 0, label: 'RSI unavailable' }
  if (rsi < oversold) return { score: 1, label: `RSI ${rsi.toFixed(0)} oversold (<${oversold})` }
  if (rsi > overbought) return { score: -1, label: `RSI ${rsi.toFixed(0)} overbought (>${overbought})` }
  return { score: 0, label: `RSI ${rsi.toFixed(0)} neutral` }
}

function scoreMACD(macd: { macdLine: number; signalLine: number; histogram: number }): IndicatorScore {
  if (isNaN(macd.macdLine) || isNaN(macd.signalLine)) return { score: 0, label: 'MACD unavailable' }
  if (macd.histogram > 0 && macd.macdLine > macd.signalLine) {
    return { score: 1, label: 'MACD bullish crossover' }
  }
  if (macd.histogram < 0 && macd.macdLine < macd.signalLine) {
    return { score: -1, label: 'MACD bearish crossover' }
  }
  return { score: 0, label: 'MACD neutral' }
}

function scoreEMA(
  price: number,
  ema20: number,
  ema50: number,
  ema200: number,
  mode: TradingMode,
): IndicatorScore {
  if (isNaN(price)) return { score: 0, label: 'EMA unavailable' }

  if (mode === 'swing') {
    // Use EMA50 vs EMA200
    if (!isNaN(ema50) && !isNaN(ema200)) {
      if (price > ema50 && ema50 > ema200) return { score: 1, label: 'Price > EMA50 > EMA200 (bullish)' }
      if (price < ema50 && ema50 < ema200) return { score: -1, label: 'Price < EMA50 < EMA200 (bearish)' }
    }
    return { score: 0, label: 'EMA alignment neutral' }
  }

  if (mode === 'scalper') {
    // Just EMA20
    if (!isNaN(ema20)) {
      if (price > ema20) return { score: 1, label: 'Price above EMA20' }
      if (price < ema20) return { score: -1, label: 'Price below EMA20' }
    }
    return { score: 0, label: 'EMA neutral' }
  }

  // Intraday: EMA20 vs EMA50
  if (!isNaN(ema20) && !isNaN(ema50)) {
    if (price > ema20 && ema20 > ema50) return { score: 1, label: 'Price > EMA20 > EMA50 (bullish)' }
    if (price < ema20 && ema20 < ema50) return { score: -1, label: 'Price < EMA20 < EMA50 (bearish)' }
  }
  return { score: 0, label: 'EMA alignment neutral' }
}

function scoreSR(
  price: number,
  support: SRLevel[],
  resistance: SRLevel[],
): IndicatorScore {
  if (isNaN(price)) return { score: 0, label: 'S/R unavailable' }

  const threshold = 0.01 // 1%

  // Check nearest support
  for (const s of support) {
    const dist = Math.abs(price - s.price) / price
    if (dist < threshold) {
      return { score: 1, label: `Near support at ${s.price.toFixed(2)}` }
    }
  }

  // Check nearest resistance
  for (const r of resistance) {
    const dist = Math.abs(price - r.price) / price
    if (dist < threshold) {
      return { score: -1, label: `Near resistance at ${r.price.toFixed(2)}` }
    }
  }

  return { score: 0, label: 'No nearby S/R levels' }
}

/* ── Risk confidence adjustment ──────────────────────────────────────────── */

const RISK_ADJ: Record<RiskProfile, number> = {
  conservative: -8,
  balanced: 0,
  'high-risk': 6,
}

/* ── Main signal generator ───────────────────────────────────────────────── */

export interface SignalInput {
  indicators: AllIndicators
  support: SRLevel[]
  resistance: SRLevel[]
  symbol: string
  mode: TradingMode
  risk: RiskProfile
}

export function generateSignal(input: SignalInput): GeneratedSignal {
  const { indicators, support, resistance, mode, risk } = input
  const { rsi, ema20, ema50, ema200, macd, currentPrice } = indicators

  // Score each indicator
  const rsiResult = scoreRSI(rsi, mode)
  const macdResult = scoreMACD(macd)
  const emaResult = scoreEMA(currentPrice, ema20, ema50, ema200, mode)
  const srResult = scoreSR(currentPrice, support, resistance)

  // Weighted sum (equal 25% each)
  const weight = 0.25
  const totalScore =
    rsiResult.score * weight +
    macdResult.score * weight +
    emaResult.score * weight +
    srResult.score * weight

  // Determine direction
  let direction: SignalDirection
  if (totalScore > 0.25) direction = 'BUY'
  else if (totalScore < -0.25) direction = 'SELL'
  else direction = 'NEUTRAL'

  // Confidence: map |score| (0–1) to 35–95%
  const absScore = Math.abs(totalScore)
  const rawConfidence = 35 + absScore * 60
  const confidence = Math.max(35, Math.min(95, Math.round(rawConfidence + RISK_ADJ[risk])))

  // Technicals: true if indicator agrees with final direction
  const dirValue = direction === 'BUY' ? 1 : direction === 'SELL' ? -1 : 0
  const technicals = {
    rsi: dirValue !== 0 && rsiResult.score === dirValue,
    macd: dirValue !== 0 && macdResult.score === dirValue,
    ema: dirValue !== 0 && emaResult.score === dirValue,
    sr: dirValue !== 0 && srResult.score === dirValue,
  }

  // Build reason string
  const parts = [rsiResult, macdResult, emaResult, srResult]
    .filter((r) => r.score !== 0)
    .map((r) => r.label)

  let reason: string
  if (direction === 'NEUTRAL') {
    reason = 'Mixed signals — no clear directional bias. ' + parts.join('; ')
    if (parts.length === 0) reason = 'All indicators neutral — no actionable signal'
  } else {
    const agreeing = parts.length
    reason = `${agreeing}/4 indicators align ${direction}. ` + parts.join('; ')
  }

  return { direction, confidence, technicals, reason }
}
