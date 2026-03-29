import { NextRequest, NextResponse } from 'next/server'
import { computeIndicatorsForSymbol } from '@/app/api/indicators/route'
import { computeSRForSymbol } from '@/app/api/sr/route'
import { generateSignal } from '@/app/lib/signalEngine'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { prisma } from '@/app/lib/prisma'
import { dispatchWebhooks } from '@/app/lib/webhookDispatcher'
import { notifyNewSignal } from '@/app/lib/pushNotifier'
import { validateApiKey } from '@/app/lib/apiKeyAuth'
import { checkSignalLimit, checkAssetAccess } from '@/app/lib/planLimits'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'
import type { GeneratedSignal } from '@/app/lib/signalEngine'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface SignalsResponse {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  signal: GeneratedSignal
  timestamp: number
  rateLimited?: boolean
  staleSince?: number
}

/* ── Cache ─────────────────────────────────────────────────────────────────── */

const signalCache = new Map<string, { data: SignalsResponse; expiresAt: number; fetchedAt: number }>()
const CACHE_TTL = 30_000 // 30 seconds

import { getAllSymbols } from '@/app/lib/symbols'
const VALID_SYMBOLS = getAllSymbols().map((s) => s.symbol)
const VALID_MODES: TradingMode[] = ['swing', 'intraday', 'scalper']
const VALID_RISKS: RiskProfile[] = ['conservative', 'balanced', 'high-risk']

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // Optional API key auth — validate if key provided, block on invalid key
  const hasKey =
    request.headers.get('authorization')?.startsWith('Bearer as_') ||
    new URL(request.url).searchParams.has('api_key')
  if (hasKey) {
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
  }

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

  // Plan-based limits (only when user is logged in)
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (session.isLoggedIn && session.userId) {
      const assetAllowed = await checkAssetAccess(session.userId, symbol)
      if (!assetAllowed) {
        return NextResponse.json({ error: 'Upgrade to Pro to access this asset' }, { status: 403 })
      }
      const { allowed, remaining } = await checkSignalLimit(session.userId)
      if (!allowed) {
        return NextResponse.json({ error: 'Daily signal limit reached. Upgrade to Pro for unlimited signals.', remaining: 0 }, { status: 403 })
      }
    }
  } catch {
    // Session read failed — allow request (public access)
  }

  const cacheKey = `${symbol}:${mode}:${risk}`
  const now = Date.now()
  const cached = signalCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data)
  }

  try {
    const [indicatorsRes, srRes] = await Promise.all([
      computeIndicatorsForSymbol(symbol),
      computeSRForSymbol(symbol),
    ])

    const wasRateLimited = indicatorsRes.rateLimited || srRes.rateLimited

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
      ...(wasRateLimited ? { rateLimited: true, staleSince: indicatorsRes.staleSince ?? srRes.staleSince ?? now } : {}),
    }

    signalCache.set(cacheKey, { data, expiresAt: now + CACHE_TTL, fetchedAt: now })

    // Auto-record non-NEUTRAL signals for accuracy tracking (fire-and-forget)
    if (signal.direction !== 'NEUTRAL' && indicatorsRes.indicators?.currentPrice) {
      const entryPrice = indicatorsRes.indicators.currentPrice
      const atrPct = signal.direction === 'BUY' ? 0.01 : -0.01
      const tp1 = entryPrice * (1 + atrPct)
      const sl = entryPrice * (1 - atrPct * 0.5)
      prisma.signalRecord.create({
        data: {
          symbol,
          mode,
          direction: signal.direction,
          entryPrice,
          tp1,
          sl,
          confidence: Math.round(signal.confidence),
        },
      }).catch(() => {}) // fire-and-forget, never crash

      // Push notification (fire-and-forget)
      notifyNewSignal(symbol, signal.direction, Math.round(signal.confidence)).catch(() => {})

      // Dispatch webhooks (fire-and-forget)
      dispatchWebhooks({
        symbol,
        direction: signal.direction,
        entryPrice,
        tp1,
        sl,
        confidence: signal.confidence,
        timestamp: new Date().toISOString(),
        mode,
      }).catch(() => {})
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isRateLimited = message.includes('429') || message.includes('rate_limited')
    const cachedEntry = signalCache.get(cacheKey)
    if (cachedEntry) {
      return NextResponse.json({
        ...cachedEntry.data,
        rateLimited: isRateLimited,
        staleSince: cachedEntry.fetchedAt,
      })
    }
    return NextResponse.json({ error: message }, { status: isRateLimited ? 429 : 500 })
  }
}
