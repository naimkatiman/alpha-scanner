import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

const JSON_FIELDS = [
  'watchlist',
  'alertWatchlist',
  'alertRules',
  'signalHistory',
  'equitySnapshots',
  'tradeRecords',
] as const

const STRING_FIELDS = ['preferredMode', 'riskProfile', 'telegramBotToken', 'telegramChatId'] as const
const NUMBER_FIELDS = ['leverage', 'capital'] as const
const BOOLEAN_FIELDS = ['pushSignalAlerts', 'pushTpAlerts', 'pushSlAlerts', 'pushDailyReport'] as const
const NULLABLE_JSON_FIELDS = ['paperTradingState'] as const

function parseJsonField(value: string, fallback: unknown = []): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function serializeResponse(settings: Record<string, unknown>) {
  const result: Record<string, unknown> = {}

  for (const key of JSON_FIELDS) {
    result[key] = parseJsonField(settings[key] as string ?? '[]')
  }
  for (const key of STRING_FIELDS) {
    result[key] = settings[key] ?? null
  }
  for (const key of NUMBER_FIELDS) {
    result[key] = settings[key]
  }
  for (const key of BOOLEAN_FIELDS) {
    result[key] = settings[key] ?? true
  }
  for (const key of NULLABLE_JSON_FIELDS) {
    const val = settings[key] as string | null
    result[key] = val ? parseJsonField(val, null) : null
  }

  return result
}

export async function GET() {
  try {
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

    return NextResponse.json(serializeResponse(settings as unknown as Record<string, unknown>))
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
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

    // JSON array fields — accept arrays, store as JSON strings
    for (const key of JSON_FIELDS) {
      if (body[key] !== undefined) {
        data[key] = JSON.stringify(body[key])
      }
    }

    // Nullable JSON field (paperTradingState)
    for (const key of NULLABLE_JSON_FIELDS) {
      if (body[key] !== undefined) {
        data[key] = body[key] !== null ? JSON.stringify(body[key]) : null
      }
    }

    // String fields
    for (const key of STRING_FIELDS) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    // Number fields
    for (const key of NUMBER_FIELDS) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    // Boolean fields (push notification preferences)
    for (const key of BOOLEAN_FIELDS) {
      if (body[key] !== undefined) data[key] = Boolean(body[key])
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return NextResponse.json(serializeResponse(settings as unknown as Record<string, unknown>))
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
