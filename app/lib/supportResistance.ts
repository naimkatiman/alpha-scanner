export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export type SRLevel = {
  price: number
  strength: number
  touches: number
  type: 'support' | 'resistance'
}

export function computeSR(
  candles: Candle[],
  currentPrice: number,
): { support: SRLevel[]; resistance: SRLevel[] } {
  const LOOKBACK = 5
  if (candles.length < LOOKBACK * 2 + 1) return { support: [], resistance: [] }

  const pivotHighs: number[] = []
  const pivotLows: number[] = []

  for (let i = LOOKBACK; i < candles.length - LOOKBACK; i++) {
    const c = candles[i]
    const left = candles.slice(i - LOOKBACK, i)
    const right = candles.slice(i + 1, i + LOOKBACK + 1)

    if (left.every((x) => x.high < c.high) && right.every((x) => x.high < c.high)) {
      pivotHighs.push(c.high)
    }
    if (left.every((x) => x.low > c.low) && right.every((x) => x.low > c.low)) {
      pivotLows.push(c.low)
    }
  }

  function cluster(prices: number[]): { price: number; touches: number }[] {
    if (prices.length === 0) return []
    const TOLERANCE = 0.005
    const clusters: { price: number; touches: number }[] = []
    for (const p of prices) {
      let merged = false
      for (const cl of clusters) {
        if (Math.abs(cl.price - p) / cl.price <= TOLERANCE) {
          cl.price = (cl.price * cl.touches + p) / (cl.touches + 1)
          cl.touches++
          merged = true
          break
        }
      }
      if (!merged) clusters.push({ price: p, touches: 1 })
    }
    return clusters.sort((a, b) => b.touches - a.touches)
  }

  const resClusters = cluster(pivotHighs)
  const supClusters = cluster(pivotLows)

  const maxTouches = Math.max(
    ...resClusters.map((c) => c.touches),
    ...supClusters.map((c) => c.touches),
    1,
  )

  const resistance: SRLevel[] = resClusters
    .filter((c) => c.price > currentPrice)
    .slice(0, 3)
    .map((c) => ({
      price: c.price,
      strength: c.touches / maxTouches,
      touches: c.touches,
      type: 'resistance' as const,
    }))
    .sort((a, b) => a.price - b.price)

  const support: SRLevel[] = supClusters
    .filter((c) => c.price < currentPrice)
    .slice(0, 3)
    .map((c) => ({
      price: c.price,
      strength: c.touches / maxTouches,
      touches: c.touches,
      type: 'support' as const,
    }))
    .sort((a, b) => b.price - a.price)

  return { support, resistance }
}
