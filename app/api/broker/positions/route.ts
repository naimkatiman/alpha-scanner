import { NextRequest, NextResponse } from 'next/server'
import { getPositions, hasSession } from '@/app/lib/brokerApi'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  if (!hasSession(sessionId)) {
    return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 })
  }

  try {
    const positions = await getPositions(sessionId)
    const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0)
    const totalSwap = positions.reduce((sum, p) => sum + p.swap, 0)

    return NextResponse.json({
      positions,
      totalProfit,
      totalSwap,
      count: positions.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
