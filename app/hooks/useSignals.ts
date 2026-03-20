'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'
import type { GeneratedSignal } from '@/app/lib/signalEngine'

export interface UseSignalsReturn {
  signal: GeneratedSignal | null
  loading: boolean
  error: string | null
}

export function useSignals(symbol: string, mode: TradingMode, risk: RiskProfile): UseSignalsReturn {
  const [signal, setSignal] = useState<GeneratedSignal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSignal = useCallback(async () => {
    try {
      const params = new URLSearchParams({ symbol, mode, risk })
      const res = await fetch(`/api/signals?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { signal: GeneratedSignal }
      setSignal(json.signal)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signal')
    } finally {
      setLoading(false)
    }
  }, [symbol, mode, risk])

  useEffect(() => {
    setLoading(true)
    void fetchSignal()
    const interval = setInterval(() => {
      void fetchSignal()
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchSignal])

  return { signal, loading, error }
}
