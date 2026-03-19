'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SRLevel } from '@/app/lib/supportResistance'

interface SRData {
  support: SRLevel[]
  resistance: SRLevel[]
  currentPrice: number
  timestamp: number
}

export interface UseSRReturn {
  support: SRLevel[]
  resistance: SRLevel[]
  currentPrice: number | null
  loading: boolean
  error: string | null
}

export function useSR(symbol: string): UseSRReturn {
  const [data, setData] = useState<SRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSR = useCallback(async () => {
    try {
      const res = await fetch(`/api/sr?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as SRData
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch S/R')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    setLoading(true)
    void fetchSR()
    const interval = setInterval(() => {
      void fetchSR()
    }, 60_000)
    return () => clearInterval(interval)
  }, [fetchSR])

  return {
    support: data?.support ?? [],
    resistance: data?.resistance ?? [],
    currentPrice: data?.currentPrice ?? null,
    loading,
    error,
  }
}
