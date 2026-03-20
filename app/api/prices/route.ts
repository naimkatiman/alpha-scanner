import { NextResponse } from 'next/server'
import { SYMBOL_REGISTRY } from '@/app/lib/symbols'
import { checkRateLimit } from '@/app/lib/apiGuard'

export interface SymbolPrice {
  price: number
  change24h: number
}

export interface PricesResponse {
  prices: Record<string, SymbolPrice>
  timestamp: number
  source: string
  rateLimited?: boolean
  staleSince?: number
}

/* ── Fallback prices from registry ────────────────────────────────────────── */

const FALLBACK_PRICES: Record<string, SymbolPrice> = Object.fromEntries(
  SYMBOL_REGISTRY.map((s) => [s.symbol, { price: s.fallbackPrice, change24h: 0 }]),
)

/* ── In-memory cache ──────────────────────────────────────────────────────── */

let cache: { data: PricesResponse; expiresAt: number; fetchedAt: number } | null = null
const CACHE_TTL = 30_000

/* ── Rate limit tracking ─────────────────────────────────────────────────── */

let rateLimitedUntil = 0

function isRateLimited(): boolean {
  return Date.now() < rateLimitedUntil
}

function markRateLimited(retryAfter?: number) {
  rateLimitedUntil = Date.now() + (retryAfter ? retryAfter * 1000 : 60_000)
}

/* ── Fetchers ─────────────────────────────────────────────────────────────── */

async function fetchCryptoPrices(): Promise<Record<string, SymbolPrice>> {
  const ids = SYMBOL_REGISTRY.filter((s) => s.dataSourceType === 'coingecko' && s.coingeckoId)
    .map((s) => s.coingeckoId)
    .join(',')

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '', 10)
    markRateLimited(retryAfter || undefined)
    throw new Error('rate_limited')
  }
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const data = (await res.json()) as Record<string, { usd: number; usd_24h_change?: number }>

  const result: Record<string, SymbolPrice> = {}
  for (const cfg of SYMBOL_REGISTRY.filter((s) => s.dataSourceType === 'coingecko')) {
    const id = cfg.coingeckoId
    if (id && data[id]) {
      result[cfg.symbol] = {
        price: data[id].usd,
        change24h: data[id].usd_24h_change ?? 0,
      }
    }
  }
  return result
}

async function fetchMetalsPrimary(): Promise<Record<string, SymbolPrice>> {
  const res = await fetch('https://api.metals.live/v1/spot/gold,silver', {
    signal: AbortSignal.timeout(8000),
  })
  if (res.status === 429) {
    markRateLimited()
    throw new Error('rate_limited')
  }
  if (!res.ok) throw new Error(`metals.live ${res.status}`)
  const data = (await res.json()) as Array<{ metal: string; price: number }>
  const result: Record<string, SymbolPrice> = {}
  for (const item of data) {
    if (item.metal === 'gold') result.XAUUSD = { price: item.price, change24h: 0 }
    if (item.metal === 'silver') result.XAGUSD = { price: item.price, change24h: 0 }
  }
  if (!result.XAUUSD || !result.XAGUSD) throw new Error('Incomplete metals data')
  return result
}

async function fetchMetalsSecondary(): Promise<Record<string, SymbolPrice>> {
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json',
    { signal: AbortSignal.timeout(8000) },
  )
  if (res.status === 429) {
    markRateLimited()
    throw new Error('rate_limited')
  }
  if (!res.ok) throw new Error(`currency-api ${res.status}`)
  const xauData = (await res.json()) as { xau: Record<string, number> }
  const xauUsd = xauData.xau['usd']
  if (!xauUsd || xauUsd <= 0) throw new Error('Invalid XAU price')

  const res2 = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xag.json',
    { signal: AbortSignal.timeout(8000) },
  )
  if (res2.status === 429) {
    markRateLimited()
    throw new Error('rate_limited')
  }
  if (!res2.ok) throw new Error(`currency-api XAG ${res2.status}`)
  const xagData = (await res2.json()) as { xag: Record<string, number> }
  const xagUsd = xagData.xag['usd']
  if (!xagUsd || xagUsd <= 0) throw new Error('Invalid XAG price')

  return {
    XAUUSD: { price: xauUsd, change24h: 0 },
    XAGUSD: { price: xagUsd, change24h: 0 },
  }
}

async function fetchForexPrices(): Promise<Record<string, SymbolPrice>> {
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    { signal: AbortSignal.timeout(8000) },
  )
  if (res.status === 429) {
    markRateLimited()
    throw new Error('rate_limited')
  }
  if (!res.ok) throw new Error(`currency-api forex ${res.status}`)
  const data = (await res.json()) as { usd: Record<string, number> }
  const usd = data.usd

  const result: Record<string, SymbolPrice> = {}
  if (usd.eur && usd.eur > 0) result.EURUSD = { price: 1 / usd.eur, change24h: 0 }
  if (usd.gbp && usd.gbp > 0) result.GBPUSD = { price: 1 / usd.gbp, change24h: 0 }
  if (usd.jpy && usd.jpy > 0) result.USDJPY = { price: usd.jpy, change24h: 0 }
  if (usd.aud && usd.aud > 0) result.AUDUSD = { price: 1 / usd.aud, change24h: 0 }

  return result
}

/* ── Main fetch orchestrator ─────────────────────────────────────────────── */

async function fetchAllPrices(): Promise<PricesResponse> {
  const sources: string[] = []
  const prices: Record<string, SymbolPrice> = {}
  let wasRateLimited = false

  // If we're rate-limited and have cache, return cached immediately
  if (isRateLimited() && cache) {
    return {
      ...cache.data,
      rateLimited: true,
      staleSince: cache.fetchedAt,
    }
  }

  // Crypto
  try {
    const crypto = await fetchCryptoPrices()
    Object.assign(prices, crypto)
    sources.push('coingecko')
  } catch (err) {
    if (err instanceof Error && err.message === 'rate_limited') {
      wasRateLimited = true
    }
    for (const cfg of SYMBOL_REGISTRY.filter((s) => s.dataSourceType === 'coingecko')) {
      prices[cfg.symbol] = FALLBACK_PRICES[cfg.symbol]
    }
    sources.push('fallback-crypto')
  }

  // Metals: try primary, then secondary, then fallback
  try {
    const metals = await fetchMetalsPrimary()
    Object.assign(prices, metals)
    sources.push('metals.live')
  } catch (err) {
    if (err instanceof Error && err.message === 'rate_limited') wasRateLimited = true
    try {
      const metals = await fetchMetalsSecondary()
      Object.assign(prices, metals)
      sources.push('currency-api')
    } catch (err2) {
      if (err2 instanceof Error && err2.message === 'rate_limited') wasRateLimited = true
      prices.XAUUSD = FALLBACK_PRICES.XAUUSD
      prices.XAGUSD = FALLBACK_PRICES.XAGUSD
      sources.push('fallback-metals')
    }
  }

  // Forex
  try {
    const forex = await fetchForexPrices()
    Object.assign(prices, forex)
    sources.push('currency-api-forex')
  } catch (err) {
    if (err instanceof Error && err.message === 'rate_limited') wasRateLimited = true
    for (const cfg of SYMBOL_REGISTRY.filter((s) => s.dataSourceType === 'forex-api')) {
      prices[cfg.symbol] = FALLBACK_PRICES[cfg.symbol]
    }
    sources.push('fallback-forex')
  }

  const now = Date.now()
  const response: PricesResponse = {
    prices,
    timestamp: now,
    source: sources.join('+'),
  }

  if (wasRateLimited) {
    response.rateLimited = true
    response.staleSince = cache?.fetchedAt ?? now
  }

  return response
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const now = Date.now()

  if (cache && cache.expiresAt > now && !isRateLimited()) {
    return NextResponse.json(cache.data)
  }

  try {
    const data = await fetchAllPrices()
    cache = { data, expiresAt: now + CACHE_TTL, fetchedAt: now }
    return NextResponse.json(data)
  } catch {
    if (cache) {
      return NextResponse.json({
        ...cache.data,
        rateLimited: isRateLimited(),
        staleSince: cache.fetchedAt,
      })
    }
    const fallback: PricesResponse = {
      prices: { ...FALLBACK_PRICES },
      timestamp: now,
      source: 'fallback',
    }
    return NextResponse.json(fallback)
  }
}
