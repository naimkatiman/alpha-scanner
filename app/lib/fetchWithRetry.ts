'use client'

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

/**
 * Fetch with exponential backoff retry (max 3 retries: 1s/2s/4s).
 * Does not retry on 429 (rate limited).
 */
export async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok && res.status !== 429 && attempt < MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
    return fetchWithRetry(url, attempt + 1)
  }
  return res
}
