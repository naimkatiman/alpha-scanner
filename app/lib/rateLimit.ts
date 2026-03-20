/**
 * In-memory token bucket rate limiter.
 * 60 requests per minute per IP by default.
 */

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

const MAX_TOKENS = 60
const REFILL_RATE = 60 // tokens per minute
const REFILL_INTERVAL_MS = (60 / REFILL_RATE) * 1000 // 1 token per second

// Cleanup stale buckets every 5 minutes
const CLEANUP_INTERVAL = 5 * 60_000
const BUCKET_MAX_AGE = 10 * 60_000

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > BUCKET_MAX_AGE) {
      buckets.delete(key)
    }
  }
}

export function rateLimitCheck(ip: string): { allowed: boolean; retryAfter?: number } {
  cleanup()

  const now = Date.now()
  let bucket = buckets.get(ip)

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS - 1, lastRefill: now }
    buckets.set(ip, bucket)
    return { allowed: true }
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL_MS)

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  if (bucket.tokens > 0) {
    bucket.tokens--
    return { allowed: true }
  }

  // Rate limited — compute retry after
  const retryAfter = Math.ceil(REFILL_INTERVAL_MS / 1000)
  return { allowed: false, retryAfter }
}

/**
 * Get client IP from request headers.
 * Supports x-forwarded-for (Vercel, Cloudflare) and x-real-ip.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}
