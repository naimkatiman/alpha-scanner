import { NextResponse } from 'next/server'
import { rateLimitCheck, getClientIP } from './rateLimit'

/**
 * Check rate limit for an API request.
 * Returns a 429 Response if rate limited, or null if allowed.
 */
export function checkRateLimit(request: Request): Response | null {
  const ip = getClientIP(request)
  const { allowed, retryAfter } = rateLimitCheck(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter ?? 60),
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }
  return null
}
