import { NextResponse } from 'next/server'
import { fetchHistory } from '@/app/api/history/route'
import { computeSRForSymbol } from '@/app/api/sr/route'
import { computeTpSl } from '@/app/lib/tpslEngine'
import { calculateATR } from '@/app/lib/technicalAnalysis'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'
import type { TpSlResult } from '@/app/lib/tpslEngine'

/* ── In-memory cache — 30s TTL per symbol+mode+risk+direction combo ─────── */

const tpslCache = new Map<string, { data: TpSlResult; expiresAt: number }>()
const CACHE_TTL = 30_000

const VALID_SYMBOLS = ['XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'XRPUSD']
const VALID_MODES: TradingMode[] = ['swing', 'intraday', 'scalper']
const VALID_RISKS: RiskProfile[] = ['conservative', 'balanced', 'high-risk']
const VALID_DIRECTIONS = ['BUY', 'SELL', 'NEUTRAL'] as const

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  const symbol = searchParams.get('symbol')?.toUpperCase() ?? ''
  const mode = searchParams.get('mode') as TradingMode | null
  const risk = searchParams.get('risk') as RiskProfile | null
  const directionParam = searchParams.get('direction') as (typeof VALID_DIRECTIONS)[number] | null
  const leverage = parseFloat(searchParams.get('leverage') ?? '1')
  const capital = parseFloat(searchParams.get('capital') ?? '1000')
  const currentPriceParam = parseFloat(searchParams.get('currentPrice') ?? '0')

  if (!VALID_SYMBOLS.includes(symbol))
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  if (!mode || !VALID_MODES.includes(mode))
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  if (!risk || !VALID_RISKS.includes(risk))
    return NextResponse.json({ error: 'Invalid risk' }, { status: 400 })
  if (!directionParam || !VALID_DIRECTIONS.includes(directionParam))
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })

  const direction = directionParam
  const cacheKey = `${symbol}:${mode}:${risk}:${direction}`
  const now = Date.now()
  const cached = tpslCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({ tpsl: cached.data, timestamp: now, cached: true })
  }

  try {
    const [{ candles }, srData] = await Promise.all([
      fetchHistory(symbol),
      computeSRForSymbol(symbol),
    ])

    const currentPrice = currentPriceParam > 0 ? currentPriceParam : srData.currentPrice
    const atr = calculateATR(candles)

    const tpsl = computeTpSl({
      currentPrice,
      direction,
      symbol,
      mode,
      risk,
      leverage,
      capital,
      support: srData.support,
      resistance: srData.resistance,
      atr,
    })

    tpslCache.set(cacheKey, { data: tpsl, expiresAt: now + CACHE_TTL })
    return NextResponse.json({ tpsl, timestamp: now, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
