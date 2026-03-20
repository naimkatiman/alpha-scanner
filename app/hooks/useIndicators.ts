'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithRetry } from '@/app/lib/fetchWithRetry'
import type { AllIndicators } from '@/app/lib/technicalAnalysis'

export interface UseIndicatorsReturn {
  indicators: AllIndicators | null
  loading: boolean
  error: string | null
  retryCount: number
}

export function useIndicators(symbol: string): UseIndicatorsReturn {
  const [indicators, setIndicators] = useState<AllIndicators | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIndicators = useCallback(async () => {
    try {
      const res = await fetchWithRetry(`/api/indicators?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { indicators: AllIndicators }
      setIndicators(json.indicators)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch indicators')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    setLoading(true)
    void fetchIndicators()
    const interval = setInterval(() => void fetchIndicators(), 60_000)
    return () => clearInterval(interval)
  }, [fetchIndicators])

  return { indicators, loading, error, retryCount: 0 }
}
