'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BrokerAccount, BrokerPosition } from '../lib/brokerApi'

export type BrokerState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseBrokerReturn {
  state: BrokerState
  sessionId: string | null
  account: BrokerAccount | null
  positions: BrokerPosition[]
  totalProfit: number
  error: string | null
  retryCount: number
  connect: (token: string, accountId: string) => Promise<void>
  disconnect: () => Promise<void>
  refreshAccount: () => Promise<void>
  refreshPositions: () => Promise<void>
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

async function fetchWithRetry(
  url: string,
  attempt = 0,
): Promise<{ res: Response; retries: number }> {
  const res = await fetch(url)
  if (!res.ok && res.status !== 404 && res.status !== 401 && attempt < MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
    return fetchWithRetry(url, attempt + 1)
  }
  return { res, retries: attempt }
}

export function useBroker(): UseBrokerReturn {
  const [state, setState] = useState<BrokerState>('disconnected')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [account, setAccount] = useState<BrokerAccount | null>(null)
  const [positions, setPositions] = useState<BrokerPosition[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load persisted session on mount
  useEffect(() => {
    const saved = localStorage.getItem('broker_session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { sessionId: string }
        if (parsed.sessionId) {
          setSessionId(parsed.sessionId)
          setState('connected')
        }
      } catch {
        localStorage.removeItem('broker_session')
      }
    }
  }, [])

  const refreshAccount = useCallback(async () => {
    if (!sessionId) return
    try {
      const { res, retries } = await fetchWithRetry(
        `/api/broker/account?sessionId=${sessionId}`,
      )
      setRetryCount(retries)
      if (!res.ok) {
        if (res.status === 404) {
          setState('disconnected')
          setSessionId(null)
          setAccount(null)
          localStorage.removeItem('broker_session')
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json() as { account: BrokerAccount }
      setAccount(data.account)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh account')
    }
  }, [sessionId])

  const refreshPositions = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/broker/positions?sessionId=${sessionId}`)
      if (!res.ok) {
        if (res.status === 404) return
        return
      }
      const data = await res.json() as { positions: BrokerPosition[]; totalProfit: number }
      setPositions(data.positions)
      setTotalProfit(data.totalProfit)
    } catch {
      // Silently fail on position refresh
    }
  }, [sessionId])

  // Auto-refresh when connected
  useEffect(() => {
    if (state === 'connected' && sessionId) {
      void refreshAccount()
      void refreshPositions()
      intervalRef.current = setInterval(() => {
        void refreshAccount()
        void refreshPositions()
      }, 5000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state, sessionId, refreshAccount, refreshPositions])

  const connect = useCallback(async (token: string, accountId: string) => {
    setState('connecting')
    setError(null)

    try {
      const res = await fetch('/api/broker/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accountId }),
      })

      const data = await res.json() as {
        sessionId?: string
        state?: string
        account?: BrokerAccount
        error?: string
      }

      if (!res.ok) {
        setState('error')
        setError(data.error ?? 'Connection failed')
        return
      }

      setSessionId(data.sessionId ?? null)
      setAccount(data.account ?? null)
      setState('connected')
      setError(null)

      if (data.sessionId) {
        localStorage.setItem('broker_session', JSON.stringify({ sessionId: data.sessionId }))
      }
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (sessionId) {
      try {
        await fetch('/api/broker/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
      } catch {
        // Ignore disconnect errors
      }
    }

    setState('disconnected')
    setSessionId(null)
    setAccount(null)
    setPositions([])
    setTotalProfit(0)
    setError(null)
    localStorage.removeItem('broker_session')
  }, [sessionId])

  return {
    state,
    sessionId,
    account,
    positions,
    totalProfit,
    error,
    retryCount,
    connect,
    disconnect,
    refreshAccount,
    refreshPositions,
  }
}
