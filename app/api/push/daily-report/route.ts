import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { sendPushToAll } from '@/app/lib/pushNotifier'

// Cron-triggered: sends daily accuracy report push notification
export async function GET(request: NextRequest): Promise<Response> {
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
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const records = await prisma.signalRecord.findMany({
      where: { resolvedAt: { gte: dayAgo } },
    })

    const total = records.length
    const wins = records.filter((r) => r.outcome === 'HIT_TP1').length
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

    const sent = await sendPushToAll(
      {
        title: 'Daily Accuracy Report',
        body: `${wins}/${total} signals hit TP1 (${winRate}% win rate) in the last 24h`,
        tag: 'daily-report',
        url: '/accuracy',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      },
      'pushDailyReport',
    )

    return NextResponse.json({ success: true, sent, stats: { total, wins, winRate } })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
