import { NextResponse } from 'next/server'
import { computeIndicatorsForSymbol } from '@/app/api/indicators/route'
import { computeSRForSymbol } from '@/app/api/sr/route'
import { generateSignal } from '@/app/lib/signalEngine'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'
import type { GeneratedSignal } from '@/app/lib/signalEngine'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface SignalsResponse {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  signal: GeneratedSignal
  timestamp: number
}

/* ── Cache ─────────────────────────────────────────────────────────────────── */

const signalCache = new Map<string, { data: SignalsResponse; expiresAt: number }>()
const CACHE_TTL = 30_000 // 30 seconds

const VALID_SYMBOLS = ['XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'XRPUSD']
const VALID_MODES: TradingMode[] = ['swing', 'intraday', 'scalper']
const VALID_RISKS: RiskProfile[] = ['conservative', 'balanced', 'high-risk']

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()
  const mode = searchParams.get('mode')?.toLowerCase() as TradingMode | undefined
  const risk = searchParams.get('risk')?.toLowerCase() as RiskProfile | undefined

  if (!symbol || !VALID_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  }
  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }
  if (!risk || !VALID_RISKS.includes(risk)) {
    return NextResponse.json({ error: 'Invalid risk' }, { status: 400 })
  }

  const cacheKey = `${symbol}:${mode}:${risk}`
  const now = Date.now()
  const cached = signalCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data)
  }

  try {
    // Fetch indicators and S/R in parallel
    const [indicatorsRes, srRes] = await Promise.all([
      computeIndicatorsForSymbol(symbol),
      computeSRForSymbol(symbol),
    ])

    const signal = generateSignal({
      indicators: indicatorsRes.indicators,
      support: srRes.support,
      resistance: srRes.resistance,
      symbol,
      mode,
      risk,
    })

    const data: SignalsResponse = {
      symbol,
      mode,
      risk,
      signal,
      timestamp: now,
    }

    signalCache.set(cacheKey, { data, expiresAt: now + CACHE_TTL })
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
