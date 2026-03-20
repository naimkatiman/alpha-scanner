/* ── TP/SL Calculation Engine ──────────────────────────────────────────────── */
// Pure functions — no side effects, no network calls.
// Computes entry, SL, TP1/2/3 via ATR + Fibonacci extensions + S/R snapping.

import { getPipSize } from '../data/mockSignals'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import type { SRLevel } from './supportResistance'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface TpSlInput {
  currentPrice: number
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  leverage: number
  capital: number
  support: SRLevel[]
  resistance: SRLevel[]
  atr: number
}

export interface TpSlResult {
  entry: number
  sl: number
  tp1: number
  tp2: number
  tp3: number
  rr1: number
  rr2: number
  rr3: number
  positionSize: number
  pipVal: number
  riskAmount: number
  slDistance: number
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
}

/* ── Constants ────────────────────────────────────────────────────────────── */

// ATR multiplier per mode (how many ATRs away to place the SL)
const MODE_ATR_MULTIPLIER: Record<TradingMode, number> = {
  swing: 2.0,
  intraday: 1.5,
  scalper: 1.0,
}

// Risk capital fraction per risk profile
const RISK_FRACTION: Record<RiskProfile, number> = {
  conservative: 0.01,
  balanced: 0.02,
  'high-risk': 0.05,
}

/* ── Main engine ──────────────────────────────────────────────────────────── */

export function computeTpSl(input: TpSlInput): TpSlResult {
  const { currentPrice, direction, symbol, mode, risk, capital, support, resistance, atr } = input

  const entry = currentPrice
  const riskFraction = RISK_FRACTION[risk]
  const riskAmount = capital * riskFraction

  // NEUTRAL uses a tighter ATR multiplier (0.75×)
  const isNeutral = direction === 'NEUTRAL'
  const neutralFactor = isNeutral ? 0.75 : 1.0
  const atrMultiplier = MODE_ATR_MULTIPLIER[mode] * neutralFactor

  // Base ATR fallback: 0.2% of entry price if ATR is unavailable
  const baseATR = !isNaN(atr) && atr > 0 ? atr : entry * 0.002
  let slDistance = baseATR * atrMultiplier

  // S/R snapping: if a support/resistance level is within 1.2× ATR distance, use it as SL
  const srSnapDist = baseATR * atrMultiplier * 1.2

  if (direction === 'BUY') {
    // SL below entry — look for nearest support below
    const snap = support
      .filter((s) => s.price < entry && entry - s.price <= srSnapDist)
      .sort((a, b) => b.price - a.price)[0]
    if (snap) slDistance = entry - snap.price
  } else if (direction === 'SELL') {
    // SL above entry — look for nearest resistance above
    const snap = resistance
      .filter((r) => r.price > entry && r.price - entry <= srSnapDist)
      .sort((a, b) => a.price - b.price)[0]
    if (snap) slDistance = snap.price - entry
  }

  // Safety clamps: at least 0.01% of price, at most (riskFraction × 5) of price
  slDistance = Math.max(slDistance, entry * 0.0001)
  slDistance = Math.min(slDistance, entry * riskFraction * 5)

  const sl = direction === 'SELL' ? entry + slDistance : entry - slDistance

  // Fibonacci extensions from entry to SL
  // NEUTRAL: tighter TP1 only at 1.272; TP2/TP3 same as TP1 (one target)
  const tp1Fib = isNeutral ? 1.272 : 1.618
  const tp1Distance = slDistance * tp1Fib
  const tp2Distance = isNeutral ? tp1Distance : slDistance * 2.618
  const tp3Distance = isNeutral ? tp1Distance : slDistance * 4.236

  // Direction of TPs: +1 for BUY/NEUTRAL, -1 for SELL
  const sign = direction === 'SELL' ? -1 : 1
  const tp1 = entry + sign * tp1Distance
  const tp2 = entry + sign * tp2Distance
  const tp3 = entry + sign * tp3Distance

  // Position sizing
  // pipVal: dollar value per pip for this position, sized so that SL = riskAmount
  const pipSize = getPipSize(symbol)
  const slPips = slDistance / pipSize
  const pipVal = slPips > 0 ? riskAmount / slPips : 0

  // positionSize: notional units (contracts/oz/coins) at risk
  // = riskAmount / slDistance (price distance per unit)
  const positionSize = slDistance > 0 ? riskAmount / slDistance : 0

  return {
    entry,
    sl,
    tp1,
    tp2,
    tp3,
    rr1: tp1Distance / slDistance,
    rr2: tp2Distance / slDistance,
    rr3: tp3Distance / slDistance,
    positionSize,
    pipVal,
    riskAmount,
    slDistance,
    direction,
  }
}
