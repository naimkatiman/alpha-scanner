import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/app/lib/apiGuard'

interface TelegramTestBody {
  botToken: string
  chatId: string
}

export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = (await request.json()) as TelegramTestBody

    if (!body.botToken || !body.chatId) {
      return NextResponse.json(
        { error: 'Missing botToken or chatId' },
        { status: 400 },
      )
    }

    const token = body.botToken.trim()
    const chatId = body.chatId.trim()

    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '<b>Alpha Scanner Connected!</b>\n\nYou will receive signal alerts here.',
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { error: data.description || `Telegram API error ${res.status}` },
        { status: res.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
