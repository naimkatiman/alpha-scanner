import { NextResponse } from 'next/server'
import type { Candle } from '@/app/lib/supportResistance'

export interface HistoryResponse {
  symbol: string
  candles: Candle[]
  source: string
}

/* ── Lookups ──────────────────────────────────────────────────────────────── */

const CRYPTO_IDS: Record<string, string> = {
  BTCUSD: 'bitcoin',
  ETHUSD: 'ethereum',
  XRPUSD: 'ripple',
}

const METAL_VOLATILITY: Record<string, number> = {
  XAUUSD: 0.01,
  XAGUSD: 0.02,
}

const FALLBACK_PRICES: Record<string, number> = {
  XAUUSD: 2920,
  XAGUSD: 32.5,
  BTCUSD: 84000,
  ETHUSD: 1920,
  XRPUSD: 2.35,
}

const CRYPTO_VOLATILITY: Record<string, number> = {
  BTCUSD: 0.03,
  ETHUSD: 0.04,
  XRPUSD: 0.05,
}

const VALID_SYMBOLS = ['XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'XRPUSD']

/* ── In-memory cache ──────────────────────────────────────────────────────── */

const historyCache = new Map<string, { data: HistoryResponse; expiresAt: number }>()
const CACHE_TTL = 5 * 60_000

/* ── Synthetic candle generator ───────────────────────────────────────────── */

export function generateSyntheticCandles(
  currentPrice: number,
  dailyVol: number,
  days: number,
): Candle[] {
  const DAY_MS = 86_400_000
  const now = Date.now()

  // Walk backwards from current price to build history
  const closes: number[] = [currentPrice]
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.5) * 2 * dailyVol
    closes.unshift(closes[0] / (1 + change))
  }

  return closes.map((close, i) => {
    const open = i === 0 ? close * (1 + (Math.random() - 0.5) * dailyVol) : closes[i - 1]
    const intraRange = close * dailyVol
    const high = Math.max(open, close) + Math.abs(Math.random() * intraRange)
    const low = Math.min(open, close) - Math.abs(Math.random() * intraRange)
    return {
      time: now - (days - 1 - i) * DAY_MS,
      open,
      high,
      low,
      close,
    }
  })
}

/* ── Crypto fetcher (CoinGecko OHLC) ──────────────────────────────────────── */

export async function fetchCryptoCandles(symbol: string): Promise<Candle[]> {
  const id = CRYPTO_IDS[symbol]
  if (!id) throw new Error(`Unknown crypto symbol: ${symbol}`)
  const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=30`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CoinGecko OHLC ${res.status}`)
  const data = (await res.json()) as number[][]
  return data.map((d) => ({
    time: d[0],
    open: d[1],
    high: d[2],
    low: d[3],
    close: d[4],
  }))
}

/* ── Metals current price fetcher ─────────────────────────────────────────── */

async function fetchMetalCurrentPrice(symbol: string): Promise<number> {
  const metalName = symbol === 'XAUUSD' ? 'gold' : 'silver'
  try {
    const res = await fetch(`https://api.metals.live/v1/spot/${metalName},${metalName}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`metals.live ${res.status}`)
    const data = (await res.json()) as Array<{ metal: string; price: number }>
    const item = data.find((d) => d.metal === metalName)
    if (item && item.price > 0) return item.price
    throw new Error('No metal price in response')
  } catch {
    // Fallback: fawazahmed0 currency API
    const currency = symbol === 'XAUUSD' ? 'xau' : 'xag'
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.json`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) throw new Error(`currency-api ${res.status}`)
    const raw = (await res.json()) as Record<string, Record<string, number>>
    const price = raw[currency]?.['usd']
    if (price && price > 0) return price
    throw new Error('Invalid metal price')
  }
}

/* ── Metal candle builder ─────────────────────────────────────────────────── */

export async function fetchMetalCandles(symbol: string): Promise<Candle[]> {
  const vol = METAL_VOLATILITY[symbol] ?? 0.01
  const fallbackPrice = FALLBACK_PRICES[symbol] ?? 2000
  try {
    const currentPrice = await fetchMetalCurrentPrice(symbol)
    return generateSyntheticCandles(currentPrice, vol, 30)
  } catch {
    return generateSyntheticCandles(fallbackPrice, vol, 30)
  }
}

/* ── Main fetcher (exported for reuse in sr/route.ts) ─────────────────────── */

export async function fetchHistory(symbol: string): Promise<HistoryResponse> {
  const now = Date.now()
  const cached = historyCache.get(symbol)
  if (cached && cached.expiresAt > now) return cached.data

  let result: HistoryResponse

  if (CRYPTO_IDS[symbol]) {
    try {
      const candles = await fetchCryptoCandles(symbol)
      result = { symbol, candles, source: 'coingecko-ohlc' }
    } catch {
      const price = FALLBACK_PRICES[symbol] ?? 1000
      const vol = CRYPTO_VOLATILITY[symbol] ?? 0.03
      result = {
        symbol,
        candles: generateSyntheticCandles(price, vol, 30),
        source: 'fallback+synthetic',
      }
    }
  } else if (METAL_VOLATILITY[symbol]) {
    const candles = await fetchMetalCandles(symbol)
    result = { symbol, candles, source: 'metals+synthetic' }
  } else {
    throw new Error(`Unknown symbol: ${symbol}`)
  }

  historyCache.set(symbol, { data: result, expiresAt: now + CACHE_TTL })
  return result
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()

  if (!symbol || !VALID_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  }

  try {
    const data = await fetchHistory(symbol)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
