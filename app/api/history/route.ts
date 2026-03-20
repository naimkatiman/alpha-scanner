import { NextResponse } from 'next/server'
import type { Candle } from '@/app/lib/supportResistance'
import { getAllSymbols, getSymbolConfig } from '@/app/lib/symbols'
import { checkRateLimit } from '@/app/lib/apiGuard'

export interface HistoryResponse {
  symbol: string
  candles: Candle[]
  source: string
}

/* ── Valid symbols from registry ──────────────────────────────────────────── */

const VALID_SYMBOLS = getAllSymbols().map((s) => s.symbol)

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
  const cfg = getSymbolConfig(symbol)
  const id = cfg?.coingeckoId
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

/* ── Forex current price fetcher ──────────────────────────────────────────── */

async function fetchForexCurrentPrice(symbol: string): Promise<number> {
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    { signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) throw new Error(`currency-api forex ${res.status}`)
  const data = (await res.json()) as { usd: Record<string, number> }
  const usd = data.usd

  switch (symbol) {
    case 'EURUSD':
      if (usd.eur && usd.eur > 0) return 1 / usd.eur
      break
    case 'GBPUSD':
      if (usd.gbp && usd.gbp > 0) return 1 / usd.gbp
      break
    case 'USDJPY':
      if (usd.jpy && usd.jpy > 0) return usd.jpy
      break
    case 'AUDUSD':
      if (usd.aud && usd.aud > 0) return 1 / usd.aud
      break
  }
  throw new Error(`Could not extract price for ${symbol}`)
}

/* ── Metal candle builder ─────────────────────────────────────────────────── */

export async function fetchMetalCandles(symbol: string): Promise<Candle[]> {
  const cfg = getSymbolConfig(symbol)
  const vol = cfg?.volatility ?? 0.01
  const fallbackPrice = cfg?.fallbackPrice ?? 2000
  try {
    const currentPrice = await fetchMetalCurrentPrice(symbol)
    return generateSyntheticCandles(currentPrice, vol, 30)
  } catch {
    return generateSyntheticCandles(fallbackPrice, vol, 30)
  }
}

/* ── Forex candle builder ─────────────────────────────────────────────────── */

async function fetchForexCandles(symbol: string): Promise<Candle[]> {
  const cfg = getSymbolConfig(symbol)
  const vol = cfg?.volatility ?? 0.005
  const fallbackPrice = cfg?.fallbackPrice ?? 1
  try {
    const currentPrice = await fetchForexCurrentPrice(symbol)
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

  const cfg = getSymbolConfig(symbol)
  if (!cfg) throw new Error(`Unknown symbol: ${symbol}`)

  let result: HistoryResponse

  if (cfg.dataSourceType === 'coingecko') {
    try {
      const candles = await fetchCryptoCandles(symbol)
      result = { symbol, candles, source: 'coingecko-ohlc' }
    } catch {
      result = {
        symbol,
        candles: generateSyntheticCandles(cfg.fallbackPrice, cfg.volatility, 30),
        source: 'fallback+synthetic',
      }
    }
  } else if (cfg.dataSourceType === 'metals-api') {
    const candles = await fetchMetalCandles(symbol)
    result = { symbol, candles, source: 'metals+synthetic' }
  } else {
    // forex-api: synthetic candles from live rate
    const candles = await fetchForexCandles(symbol)
    result = { symbol, candles, source: 'forex+synthetic' }
  }

  historyCache.set(symbol, { data: result, expiresAt: now + CACHE_TTL })
  return result
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

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
