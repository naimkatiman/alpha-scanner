import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const url = new URL(request.url)
  const sort = url.searchParams.get('sort') || 'newest'
  const minPrice = parseFloat(url.searchParams.get('minPrice') || '0')
  const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999')
  const assetType = url.searchParams.get('assetType') || 'all'
  const authorOnly = url.searchParams.get('author') === 'me'

  let authorId: string | undefined
  if (authorOnly) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    authorId = session.userId
  }

  const where = {
    ...(authorId ? { authorId } : { isPublished: true }),
    price: { gte: minPrice, lte: maxPrice },
    ...(assetType !== 'all' ? { assetType } : {}),
  }

  try {
    const listings = await prisma.strategyListing.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: sort === 'price' ? { price: 'asc' } : { createdAt: 'desc' },
    })

    // Parse JSON fields and sort by winRate if needed
    const parsed = listings.map((l) => {
      let backtest: Record<string, unknown> = {}
      try {
        backtest = JSON.parse(l.backtestResults) as Record<string, unknown>
      } catch {
        // Malformed JSON — use empty defaults
      }
      return {
        id: l.id,
        name: l.name,
        description: l.description,
        price: l.price,
        assetType: l.assetType,
        isPublished: l.isPublished,
        winRate: typeof backtest.winRate === 'number' ? backtest.winRate : null,
        totalTrades: typeof backtest.totalTrades === 'number' ? backtest.totalTrades : null,
        profitFactor: typeof backtest.profitFactor === 'number' ? backtest.profitFactor : null,
        author: l.author,
        purchaseCount: l._count.purchases,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }
    })

    if (sort === 'winRate') {
      parsed.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
    } else if (sort === 'popular') {
      parsed.sort((a, b) => b.purchaseCount - a.purchaseCount)
    }

    return NextResponse.json({ listings: parsed })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch marketplace listings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, price, indicatorsConfig, backtestResults, assetType, isPublished } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 200) {
    return NextResponse.json({ error: 'Name is required (max 200 chars)' }, { status: 400 })
  }
  if (typeof description === 'string' && description.length > 5000) {
    return NextResponse.json({ error: 'Description too long (max 5000 chars)' }, { status: 400 })
  }
  if (typeof price !== 'number' || price < 0.99) {
    return NextResponse.json({ error: 'Price must be at least $0.99' }, { status: 400 })
  }
  if (!indicatorsConfig) {
    return NextResponse.json({ error: 'Indicators config is required' }, { status: 400 })
  }

  const VALID_ASSET_TYPES = ['crypto', 'forex', 'stocks', 'futures']
  const validatedAssetType = VALID_ASSET_TYPES.includes(assetType) ? assetType : 'crypto'

  const configStr = typeof indicatorsConfig === 'string' ? indicatorsConfig : JSON.stringify(indicatorsConfig)
  const backtestStr = backtestResults ? (typeof backtestResults === 'string' ? backtestResults : JSON.stringify(backtestResults)) : '{}'

  if (configStr.length > 50000 || backtestStr.length > 50000) {
    return NextResponse.json({ error: 'Config or backtest data too large' }, { status: 400 })
  }

  try {
    const listing = await prisma.strategyListing.create({
      data: {
        authorId: session.userId,
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        price,
        indicatorsConfig: configStr,
        backtestResults: backtestStr,
        assetType: validatedAssetType,
        isPublished: isPublished ?? false,
      },
    })

    return NextResponse.json({
      id: listing.id,
      name: listing.name,
      description: listing.description,
      price: listing.price,
      assetType: listing.assetType,
      isPublished: listing.isPublished,
      createdAt: listing.createdAt,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
