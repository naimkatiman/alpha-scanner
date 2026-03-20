import { NextResponse } from 'next/server'
import { fetchHistory } from '@/app/api/history/route'
import { computeSR } from '@/app/lib/supportResistance'
import { checkRateLimit } from '@/app/lib/apiGuard'
import type { SRLevel } from '@/app/lib/supportResistance'

export interface SRResponse {
  symbol: string
  support: SRLevel[]
  resistance: SRLevel[]
  currentPrice: number
  timestamp: number
  rateLimited?: boolean
  staleSince?: number
}

/* ── In-memory cache ──────────────────────────────────────────────────────── */

const srCache = new Map<string, { data: SRResponse; expiresAt: number; fetchedAt: number }>()
const CACHE_TTL = 2 * 60_000

import { getAllSymbols } from '@/app/lib/symbols'
const VALID_SYMBOLS = getAllSymbols().map((s) => s.symbol)

/* ── SR computation ───────────────────────────────────────────────────────── */

export async function computeSRForSymbol(symbol: string): Promise<SRResponse> {
  const now = Date.now()
  const cached = srCache.get(symbol)
  if (cached && cached.expiresAt > now) return cached.data

  const { candles } = await fetchHistory(symbol)

  if (candles.length === 0) {
    const data: SRResponse = {
      symbol,
      support: [],
      resistance: [],
      currentPrice: 0,
      timestamp: now,
    }
    srCache.set(symbol, { data, expiresAt: now + CACHE_TTL, fetchedAt: now })
    return data
  }

  const currentPrice = candles[candles.length - 1].close
  const { support, resistance } = computeSR(candles, currentPrice)

  const data: SRResponse = { symbol, support, resistance, currentPrice, timestamp: now }
  srCache.set(symbol, { data, expiresAt: now + CACHE_TTL, fetchedAt: now })
  return data
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
    const data = await computeSRForSymbol(symbol)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isRateLimited = message.includes('429') || message.includes('rate_limited')
    const cached = srCache.get(symbol)
    if (cached) {
      return NextResponse.json({
        ...cached.data,
        rateLimited: isRateLimited,
        staleSince: cached.fetchedAt,
      })
    }
    return NextResponse.json({ error: message }, { status: isRateLimited ? 429 : 500 })
  }
}
