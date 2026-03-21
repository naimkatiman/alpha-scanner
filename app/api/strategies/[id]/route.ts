import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { checkRateLimit } from '../../../lib/apiGuard'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const { id } = await params

  // Try by id first, then shareSlug
  const strategy = await prisma.strategyTemplate.findFirst({
    where: { OR: [{ id }, { shareSlug: id }] },
  })

  if (!strategy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // If private, require ownership
  if (!strategy.isPublic && strategy.userId !== null) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (userId !== strategy.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return NextResponse.json({ ...strategy, config: JSON.parse(strategy.config) })
}

export async function PUT(request: Request, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const strategy = await prisma.strategyTemplate.findUnique({ where: { id } })

  if (!strategy || strategy.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { name, description, config, isPublic } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = String(name).trim()
    if (description !== undefined) data.description = description ? String(description).trim() : null
    if (config !== undefined) data.config = JSON.stringify(config)
    if (isPublic !== undefined) {
      data.isPublic = Boolean(isPublic)
      if (isPublic && !strategy.shareSlug) {
        data.shareSlug = Math.random().toString(36).slice(2, 12)
      }
    }

    const updated = await prisma.strategyTemplate.update({ where: { id }, data })
    return NextResponse.json({ ...updated, config: JSON.parse(updated.config) })
  } catch {
    return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const strategy = await prisma.strategyTemplate.findUnique({ where: { id } })

  if (!strategy || strategy.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.strategyTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
