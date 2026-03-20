import { NextResponse } from 'next/server'
import { fetchHistory } from '@/app/api/history/route'
import { computeAllIndicators, type AllIndicators } from '@/app/lib/technicalAnalysis'
import { checkRateLimit } from '@/app/lib/apiGuard'

export interface IndicatorsResponse {
  symbol: string
  indicators: AllIndicators
  source: string
  rateLimited?: boolean
  staleSince?: number
}

/* ── In-memory cache ──────────────────────────────────────────────────────── */

const indicatorsCache = new Map<string, { data: IndicatorsResponse; expiresAt: number; fetchedAt: number }>()
const CACHE_TTL = 60_000 // 60 seconds

import { getAllSymbols } from '@/app/lib/symbols'
const VALID_SYMBOLS = getAllSymbols().map((s) => s.symbol)

/* ── Compute indicators for a symbol ─────────────────────────────────────── */

export async function computeIndicatorsForSymbol(symbol: string): Promise<IndicatorsResponse> {
  const now = Date.now()
  const cached = indicatorsCache.get(symbol)
  if (cached && cached.expiresAt > now) return cached.data

  const { candles, source } = await fetchHistory(symbol)
  const indicators = computeAllIndicators(candles)

  const data: IndicatorsResponse = { symbol, indicators, source }
  indicatorsCache.set(symbol, { data, expiresAt: now + CACHE_TTL, fetchedAt: now })
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
    const data = await computeIndicatorsForSymbol(symbol)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isRateLimited = message.includes('429') || message.includes('rate_limited')
    const cached = indicatorsCache.get(symbol)
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
