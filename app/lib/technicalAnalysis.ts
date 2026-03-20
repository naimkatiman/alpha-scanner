/* ── Technical Analysis Library ───────────────────────────────────────────── */
// Pure functions — no side effects, no imports. All inputs are closing price arrays.

/* ── RSI (Wilder's Smoothing) ─────────────────────────────────────────────── */

export function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return NaN

  // Initial average gain / loss over first `period` bars
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1]
    if (delta > 0) avgGain += delta
    else avgLoss += Math.abs(delta)
  }
  avgGain /= period
  avgLoss /= period

  // Wilder's smoothing for remaining bars
  for (let i = period + 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1]
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? Math.abs(delta) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/* ── EMA ──────────────────────────────────────────────────────────────────── */

export function computeEMA(closes: number[], period: number): number {
  if (closes.length === 0) return NaN
  if (closes.length < period) {
    // Not enough data — use simple average of available data
    return closes.reduce((a, b) => a + b, 0) / closes.length
  }

  const k = 2 / (period + 1)
  // Seed with SMA of first `period` bars
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
  }
  return ema
}

/* ── MACD (12, 26, 9) ─────────────────────────────────────────────────────── */

export function computeMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): { macdLine: number; signalLine: number; histogram: number } {
  const NaN3 = { macdLine: NaN, signalLine: NaN, histogram: NaN }
  if (closes.length < slow) return NaN3

  // Build series of MACD line values for each bar from index (slow-1) onwards
  const macdSeries: number[] = []
  for (let end = slow; end <= closes.length; end++) {
    const slice = closes.slice(0, end)
    const fastEMA = computeEMA(slice, fast)
    const slowEMA = computeEMA(slice, slow)
    macdSeries.push(fastEMA - slowEMA)
  }

  const macdLine = macdSeries[macdSeries.length - 1]

  // Signal line = EMA(signalPeriod) of MACD series
  const signalLine = computeEMA(macdSeries, signalPeriod)
  const histogram = macdLine - signalLine

  return { macdLine, signalLine, histogram }
}

/* ── ATR (Average True Range, Wilder's Smoothing) ─────────────────────────── */

export function calculateATR(
  candles: { high: number; low: number; close: number }[],
  period = 14,
): number {
  if (candles.length < 2) return NaN

  const trueRanges: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const prevClose = candles[i - 1].close
    const { high, low } = candles[i]
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
  }

  if (trueRanges.length < period) {
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length
  }

  // Seed with SMA of first `period` TRs, then Wilder's smoothing
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period
  }
  return atr
}

/* ── All-in-one ───────────────────────────────────────────────────────────── */

export interface AllIndicators {
  rsi: number
  ema20: number
  ema50: number
  ema200: number
  macd: { macdLine: number; signalLine: number; histogram: number }
  currentPrice: number
}

export function computeAllIndicators(candles: Array<{ close: number }>): AllIndicators {
  const closes = candles.map((c) => c.close)
  const currentPrice = closes[closes.length - 1] ?? NaN

  return {
    rsi: computeRSI(closes),
    ema20: computeEMA(closes, 20),
    ema50: computeEMA(closes, 50),
    ema200: computeEMA(closes, 200),
    macd: computeMACD(closes),
    currentPrice,
  }
}
