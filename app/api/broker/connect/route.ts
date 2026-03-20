import { NextResponse } from 'next/server'
import { connectBroker } from '@/app/lib/brokerApi'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { sanitizeInput, isValidToken, isValidAccountId } from '@/app/lib/sanitize'

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json() as { token?: string; accountId?: string }
    const token = sanitizeInput(body.token ?? '', 512)
    const accountId = sanitizeInput(body.accountId ?? '', 128)

    if (!isValidToken(token)) {
      return NextResponse.json(
        { error: 'Invalid MetaApi token' },
        { status: 400 },
      )
    }

    if (!isValidAccountId(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 },
      )
    }

    const session = await connectBroker(token, accountId)

    if (session.state === 'error') {
      return NextResponse.json(
        { error: session.lastError ?? 'Connection failed', state: session.state },
        { status: 401 },
      )
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      state: session.state,
      account: session.account,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
