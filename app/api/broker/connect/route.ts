import { NextResponse } from 'next/server'
import { connectBroker } from '@/app/lib/brokerApi'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string; accountId?: string }
    const { token, accountId } = body

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid MetaApi token' },
        { status: 400 },
      )
    }

    if (!accountId || typeof accountId !== 'string' || accountId.length < 5) {
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
