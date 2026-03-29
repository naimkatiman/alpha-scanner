import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: Request) {
  const rateLimited = checkRateLimit(request)
  if (rateLimited) return rateLimited

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || undefined
  const limitParam = parseInt(searchParams.get('limit') ?? '50', 10)
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100)

  try {
    const signals = await prisma.signalRecord.findMany({
      where: symbol ? { symbol } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        symbol: true,
        mode: true,
        direction: true,
        entryPrice: true,
        tp1: true,
        sl: true,
        confidence: true,
        outcome: true,
        createdAt: true,
        resolvedAt: true,
      },
    })

    return NextResponse.json(signals, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
