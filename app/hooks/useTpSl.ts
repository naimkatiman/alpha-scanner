'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'
import type { TpSlResult } from '@/app/lib/tpslEngine'

export interface UseTpSlParams {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  leverage: number
  capital: number
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  currentPrice: number
}

export interface UseTpSlReturn {
  data: TpSlResult | null
  loading: boolean
  error: string | null
}

export function useTpSl({
  symbol,
  mode,
  risk,
  leverage,
  capital,
  direction,
  currentPrice,
}: UseTpSlParams): UseTpSlReturn {
  const [data, setData] = useState<TpSlResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTpSl = useCallback(async () => {
    if (currentPrice <= 0) return
    try {
      const params = new URLSearchParams({
        symbol,
        mode,
        risk,
        leverage: String(leverage),
        capital: String(capital),
        direction,
        currentPrice: String(currentPrice),
      })
      const res = await fetch(`/api/tpsl?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { tpsl: TpSlResult }
      setData(json.tpsl)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch TP/SL')
    } finally {
      setLoading(false)
    }
  }, [symbol, mode, risk, leverage, capital, direction, currentPrice])

  useEffect(() => {
    setLoading(true)
    void fetchTpSl()
    const interval = setInterval(() => void fetchTpSl(), 30_000)
    return () => clearInterval(interval)
  }, [fetchTpSl])

  return { data, loading, error }
}
