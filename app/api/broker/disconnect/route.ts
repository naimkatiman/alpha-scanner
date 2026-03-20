import { NextResponse } from 'next/server'
import { disconnectBroker } from '@/app/lib/brokerApi'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { sessionId?: string }
    const { sessionId } = body

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    const success = await disconnectBroker(sessionId)

    if (!success) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
