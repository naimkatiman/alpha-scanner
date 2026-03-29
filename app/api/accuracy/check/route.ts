import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { notifyTpHit, notifySlHit } from '@/app/lib/pushNotifier'

// This route is called by a cron job every 15 minutes to check pending signals
// against current prices and update their outcomes.

async function fetchCurrentPrices(): Promise<Record<string, number>> {
  try {
    // Reuse the internal prices logic
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/prices`, { cache: 'no-store' })
    if (!res.ok) return {}
    const data = await res.json()
    const prices: Record<string, number> = {}
    if (data.prices) {
      for (const [sym, info] of Object.entries(data.prices)) {
        if (info && typeof info === 'object' && 'price' in info) {
          prices[sym] = (info as { price: number }).price
        }
      }
    }
    return prices
  } catch {
    return {}
  }
}

export async function GET(request: Request): Promise<Response> {
  // Simple auth check — require a secret or allow localhost
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  if (secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const prices = await fetchCurrentPrices()
    if (Object.keys(prices).length === 0) {
      return NextResponse.json({ error: 'Could not fetch prices', checked: 0 })
    }

    // Get all pending signals
    const pending = await prisma.signalRecord.findMany({
      where: { outcome: 'PENDING' },
    })

    let checked = 0
    let resolved = 0
    const now = new Date()
    const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

    for (const record of pending) {
      const currentPrice = prices[record.symbol]
      if (!currentPrice) continue

      checked++
      let newOutcome: string | null = null

      if (record.direction === 'BUY') {
        if (currentPrice >= record.tp1) newOutcome = 'HIT_TP1'
        else if (currentPrice <= record.sl) newOutcome = 'HIT_SL'
      } else {
        // SELL
        if (currentPrice <= record.tp1) newOutcome = 'HIT_TP1'
        else if (currentPrice >= record.sl) newOutcome = 'HIT_SL'
      }

      // Expire after 24h
      if (!newOutcome && now.getTime() - record.createdAt.getTime() > EXPIRY_MS) {
        newOutcome = 'EXPIRED'
      }

      if (newOutcome) {
        await prisma.signalRecord.update({
          where: { id: record.id },
          data: { outcome: newOutcome, resolvedAt: now },
        })
        resolved++

        // Push notifications for TP/SL hits (fire-and-forget)
        if (newOutcome === 'HIT_TP1') {
          notifyTpHit(record.symbol, record.direction).catch(() => {})
        } else if (newOutcome === 'HIT_SL') {
          notifySlHit(record.symbol, record.direction).catch(() => {})
        }
      }
    }

    return NextResponse.json({ checked, resolved, totalPending: pending.length })
  } catch (err) {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}
