import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let settings = await prisma.userSettings.findUnique({ where: { userId } })

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId },
    })
  }

  return NextResponse.json({
    watchlist: JSON.parse(settings.watchlist),
    preferredMode: settings.preferredMode,
    riskProfile: settings.riskProfile,
    leverage: settings.leverage,
    capital: settings.capital,
    telegramBotToken: settings.telegramBotToken,
    telegramChatId: settings.telegramChatId,
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.watchlist !== undefined) data.watchlist = JSON.stringify(body.watchlist)
    if (body.preferredMode !== undefined) data.preferredMode = body.preferredMode
    if (body.riskProfile !== undefined) data.riskProfile = body.riskProfile
    if (body.leverage !== undefined) data.leverage = body.leverage
    if (body.capital !== undefined) data.capital = body.capital
    if (body.telegramBotToken !== undefined) data.telegramBotToken = body.telegramBotToken
    if (body.telegramChatId !== undefined) data.telegramChatId = body.telegramChatId

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return NextResponse.json({
      watchlist: JSON.parse(settings.watchlist),
      preferredMode: settings.preferredMode,
      riskProfile: settings.riskProfile,
      leverage: settings.leverage,
      capital: settings.capital,
      telegramBotToken: settings.telegramBotToken,
      telegramChatId: settings.telegramChatId,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
