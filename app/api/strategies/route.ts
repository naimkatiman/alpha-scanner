import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { checkRateLimit } from '../../lib/apiGuard'

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function GET(request: Request) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  const [userStrategies, publicStrategies] = await Promise.all([
    userId
      ? prisma.strategyTemplate.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        })
      : [],
    prisma.strategyTemplate.findMany({
      where: { isPublic: true, userId: null },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return NextResponse.json({ userStrategies, publicStrategies })
}

export async function POST(request: Request) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, config, isPublic } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 })
    }

    let shareSlug: string | undefined
    if (isPublic) {
      // ensure uniqueness
      let attempts = 0
      while (attempts < 5) {
        const candidate = generateSlug()
        const existing = await prisma.strategyTemplate.findUnique({ where: { shareSlug: candidate } })
        if (!existing) {
          shareSlug = candidate
          break
        }
        attempts++
      }
    }

    const strategy = await prisma.strategyTemplate.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() ?? null,
        config: JSON.stringify(config),
        isPublic: isPublic ?? false,
        shareSlug: shareSlug ?? null,
      },
    })

    return NextResponse.json({
      ...strategy,
      config: JSON.parse(strategy.config),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 })
  }
}
