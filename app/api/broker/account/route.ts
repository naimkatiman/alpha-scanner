import { NextRequest, NextResponse } from 'next/server'
import { getAccountInfo, hasSession } from '@/app/lib/brokerApi'
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
    const account = await getAccountInfo(sessionId)
    if (!account) {
      return NextResponse.json({ error: 'Failed to fetch account info' }, { status: 500 })
    }

    return NextResponse.json({ account })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
