import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'all'

  try {
    let since: Date | undefined
    const now = new Date()
    if (period === 'weekly') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'monthly') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const where = since ? { createdAt: { gte: since } } : {}

    const records = await prisma.signalRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        symbol: true,
        mode: true,
        outcome: true,
      },
    })

    // Group by symbol+mode
    type Entry = {
      symbol: string
      mode: string
      total: number
      wins: number
      losses: number
      currentStreak: number
      bestStreak: number
      lastOutcome: string | null
    }

    const map = new Map<string, Entry>()

    for (const r of records) {
      const key = `${r.symbol}::${r.mode}`
      if (!map.has(key)) {
        map.set(key, {
          symbol: r.symbol,
          mode: r.mode,
          total: 0,
          wins: 0,
          losses: 0,
          currentStreak: 0,
          bestStreak: 0,
          lastOutcome: null,
        })
      }
      const e = map.get(key)!
      e.total++

      if (r.outcome === 'HIT_TP1') {
        e.wins++
        if (e.lastOutcome === 'HIT_TP1') {
          e.currentStreak++
        } else {
          e.currentStreak = 1
        }
        if (e.currentStreak > e.bestStreak) e.bestStreak = e.currentStreak
      } else if (r.outcome === 'HIT_SL') {
        e.losses++
        e.currentStreak = 0
      }
      e.lastOutcome = r.outcome
    }

    const qualified = Array.from(map.values()).filter((e) => e.total >= 3)

    const ranked = qualified
      .map((e) => ({
        symbol: e.symbol,
        mode: e.mode,
        total: e.total,
        wins: e.wins,
        losses: e.losses,
        winRate: e.total > 0 ? Math.round((e.wins / e.total) * 1000) / 10 : 0,
        currentStreak: e.currentStreak,
        bestStreak: e.bestStreak,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 20)

    // Summary stats (all records, not just qualified)
    const totalSignals = records.length
    const totalWins = records.filter((r) => r.outcome === 'HIT_TP1').length
    const totalResolved = records.filter((r) => r.outcome === 'HIT_TP1' || r.outcome === 'HIT_SL').length
    const overallWinRate = totalResolved > 0 ? Math.round((totalWins / totalResolved) * 1000) / 10 : 0
    const mostAccurate = ranked[0]?.symbol ?? null

    return NextResponse.json({
      data: ranked,
      summary: {
        totalSignals,
        overallWinRate,
        mostAccurate,
      },
      period,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
  }
}
