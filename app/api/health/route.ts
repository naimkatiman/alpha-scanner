import { NextResponse } from 'next/server'
import { rateLimitCheck, getClientIP } from '@/app/lib/rateLimit'
import { prisma } from '@/app/lib/prisma'
import { version } from '../../../package.json'

export async function GET(request: Request) {
  const ip = getClientIP(request)
  const { allowed, retryAfter } = rateLimitCheck(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let database: 'connected' | 'disconnected' = 'disconnected'
  try {
    await prisma.$queryRaw`SELECT 1`
    database = 'connected'
  } catch {
    // database remains disconnected
  }

  return NextResponse.json({
    status: 'ok',
    version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
  })
}
