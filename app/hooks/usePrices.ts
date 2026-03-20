'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchWithRetry } from '@/app/lib/fetchWithRetry'

export interface SymbolPrice {
  price: number
  change24h: number
}

interface PricesApiResponse {
  prices: Record<string, SymbolPrice>
  timestamp: number
  source: string
  rateLimited?: boolean
  staleSince?: number
}

export interface UsePricesReturn {
  prices: Record<string, SymbolPrice> | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
  rateLimited: boolean
  retryCount: number
}

const REFRESH_NORMAL = 30_000
const REFRESH_RATE_LIMITED = 120_000

export function usePrices(): UsePricesReturn {
  const [prices, setPrices] = useState<Record<string, SymbolPrice> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inFlightRef = useRef(false)

  const fetchPrices = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const res = await fetchWithRetry('/api/prices')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: PricesApiResponse = await res.json()
      setPrices(data.prices)
      setLastUpdated(data.timestamp)
      setError(null)
      setRateLimited(data.rateLimited ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    const interval = rateLimited ? REFRESH_RATE_LIMITED : REFRESH_NORMAL
    intervalRef.current = setInterval(() => fetchPrices(), interval)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [fetchPrices, rateLimited])

  return { prices, loading, error, lastUpdated, rateLimited, retryCount: 0 }
}
