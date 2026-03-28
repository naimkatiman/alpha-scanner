/* ── Custom Alert Rules Engine ────────────────────────────────────────────── */
// Pure logic — no React, no side effects beyond localStorage.

import type { AllIndicators } from './technicalAnalysis'

/* ── Types ──────────────────────────────────────────────────────────────────── */

export type IndicatorKey =
  | 'RSI'
  | 'MACD_histogram'
  | 'stochastic_k'
  | 'bollinger_pctb'
  | 'ema20_cross'
  | 'price'

export type Operator = '<' | '>' | 'crosses_above' | 'crosses_below'

export interface Condition {
  id: string
  indicator: IndicatorKey
  operator: Operator
  value: number
}

export interface AlertRule {
  id: string
  name: string
  symbol: string
  conditions: Condition[]
  logic: 'AND' | 'OR'
  enabled: boolean
  createdAt: number
  lastTriggered?: number
  lastValue?: number  // last value of primary indicator for cross-detection
}

/* ── Storage ────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'alpha-scanner-alert-rules'

export function saveRules(rules: AlertRule[], onSync?: (value: AlertRule[]) => void): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch {
    // ignore
  }
  onSync?.(rules)
}

export function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AlertRule[]
  } catch {
    return []
  }
}

/* ── Indicator value extractor ──────────────────────────────────────────────── */

export function extractValue(indicator: IndicatorKey, indicators: AllIndicators, price: number): number {
  switch (indicator) {
    case 'RSI':
      return indicators.rsi
    case 'MACD_histogram':
      return indicators.macd.histogram
    case 'stochastic_k':
      return indicators.stochastic.k
    case 'bollinger_pctb':
      return (indicators.bollinger.percentB ?? NaN) * 100
    case 'ema20_cross':
      return price - indicators.ema20  // positive = price above EMA20
    case 'price':
      return price
    default:
      return NaN
  }
}

/* ── Rule evaluator ─────────────────────────────────────────────────────────── */

function evaluateCondition(
  condition: Condition,
  indicators: AllIndicators,
  price: number,
  prevValue?: number,
): boolean {
  const value = extractValue(condition.indicator, indicators, price)
  if (isNaN(value)) return false

  switch (condition.operator) {
    case '<':
      return value < condition.value
    case '>':
      return value > condition.value
    case 'crosses_above':
      if (prevValue === undefined) return false
      return prevValue <= condition.value && value > condition.value
    case 'crosses_below':
      if (prevValue === undefined) return false
      return prevValue >= condition.value && value < condition.value
    default:
      return false
  }
}

export function evaluateRule(
  rule: AlertRule,
  indicators: AllIndicators,
  price: number,
  prevValues?: Record<string, number>,
): boolean {
  if (!rule.enabled || rule.conditions.length === 0) return false

  const results = rule.conditions.map((cond) =>
    evaluateCondition(cond, indicators, price, prevValues?.[cond.id]),
  )

  return rule.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

/* ── Label helpers ──────────────────────────────────────────────────────────── */

export const INDICATOR_LABELS: Record<IndicatorKey, string> = {
  RSI: 'RSI (0–100)',
  MACD_histogram: 'MACD Histogram',
  stochastic_k: 'Stochastic %K',
  bollinger_pctb: 'Bollinger %B (×100)',
  ema20_cross: 'Price – EMA20',
  price: 'Price',
}

export const OPERATOR_LABELS: Record<Operator, string> = {
  '<': 'is below',
  '>': 'is above',
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
}
