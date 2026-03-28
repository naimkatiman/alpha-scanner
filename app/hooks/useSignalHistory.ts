'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SignalDirection } from '../lib/signalEngine'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface SignalRecord {
  id: string
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  direction: SignalDirection
  confidence: number
  entryPrice: number
  tp1: number
  sl: number
  timestamp: number
  outcome?: 'win' | 'loss' | 'pending'
  closedPrice?: number
  closedAt?: number
}

export interface SignalHistoryStats {
  totalSignals: number
  wins: number
  losses: number
  pending: number
  winRate: number
  bySymbol: Record<string, { wins: number; losses: number; total: number; winRate: number }>
  byMode: Record<string, { wins: number; losses: number; total: number; winRate: number }>
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'alpha-scanner-signal-history'
const MAX_RECORDS = 500
const TP1_CHECK_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useSignalHistory(
  currentSignal: {
    symbol: string
    mode: TradingMode
    risk: RiskProfile
    direction: SignalDirection
    confidence: number
    entryPrice: number
    tp1: number
    sl: number
  } | null,
  currentPrice: number,
) {
  const { isLoggedIn, serverData, loaded: syncLoaded, syncToServer } = useSettingsSyncContext()
  const [records, setRecords] = useState<SignalRecord[]>([])
  const lastRecordedRef = useRef<string>('')
  const hydratedRef = useRef(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced sync to server (signal history changes frequently)
  const debouncedSync = useCallback((data: SignalRecord[]) => {
    if (!isLoggedIn) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      syncToServer('signalHistory', data)
    }, 2000)
  }, [isLoggedIn, syncToServer])

  // Load from localStorage, overlay server data if logged in
  useEffect(() => {
    if (!syncLoaded) return
    if (hydratedRef.current) return
    hydratedRef.current = true

    let local: SignalRecord[] = []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) local = JSON.parse(stored) as SignalRecord[]
    } catch { /* ignore */ }

    if (isLoggedIn && serverData && (serverData.signalHistory as unknown[]).length > 0) {
      setRecords(serverData.signalHistory as SignalRecord[])
    } else {
      setRecords(local)
    }
  }, [syncLoaded, isLoggedIn, serverData])

  // Save to localStorage and sync
  const saveRecords = useCallback((newRecords: SignalRecord[]) => {
    const trimmed = newRecords.slice(-MAX_RECORDS)
    setRecords(trimmed)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch { /* ignore */ }
    debouncedSync(trimmed)
  }, [debouncedSync])

  // Record new signal when direction changes
  useEffect(() => {
    if (!currentSignal || currentSignal.direction === 'NEUTRAL') return
    if (!currentSignal.entryPrice || currentSignal.entryPrice <= 0) return

    const key = `${currentSignal.symbol}-${currentSignal.mode}-${currentSignal.risk}-${currentSignal.direction}`
    if (lastRecordedRef.current === key) return
    lastRecordedRef.current = key

    const newRecord: SignalRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: currentSignal.symbol,
      mode: currentSignal.mode,
      risk: currentSignal.risk,
      direction: currentSignal.direction,
      confidence: currentSignal.confidence,
      entryPrice: currentSignal.entryPrice,
      tp1: currentSignal.tp1,
      sl: currentSignal.sl,
      timestamp: Date.now(),
      outcome: 'pending',
    }

    setRecords((prev) => {
      const updated = [...prev, newRecord].slice(-MAX_RECORDS)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }
      debouncedSync(updated)
      return updated
    })
  }, [currentSignal, debouncedSync])

  // Check pending signals against current price for accuracy
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0) return

    setRecords((prev) => {
      let changed = false
      const now = Date.now()
      const updated = prev.map((r) => {
        if (r.outcome !== 'pending') return r

        if (r.direction === 'BUY') {
          if (currentPrice >= r.tp1) {
            changed = true
            return { ...r, outcome: 'win' as const, closedPrice: currentPrice, closedAt: now }
          }
          if (currentPrice <= r.sl) {
            changed = true
            return { ...r, outcome: 'loss' as const, closedPrice: currentPrice, closedAt: now }
          }
        } else if (r.direction === 'SELL') {
          if (currentPrice <= r.tp1) {
            changed = true
            return { ...r, outcome: 'win' as const, closedPrice: currentPrice, closedAt: now }
          }
          if (currentPrice >= r.sl) {
            changed = true
            return { ...r, outcome: 'loss' as const, closedPrice: currentPrice, closedAt: now }
          }
        }

        if (now - r.timestamp > TP1_CHECK_WINDOW_MS) {
          changed = true
          return { ...r, outcome: 'loss' as const, closedPrice: currentPrice, closedAt: now }
        }

        return r
      })

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch { /* ignore */ }
        debouncedSync(updated)
        return updated
      }
      return prev
    })
  }, [currentPrice, debouncedSync])

  const stats: SignalHistoryStats = computeStats(records)

  const clearHistory = useCallback(() => {
    saveRecords([])
    lastRecordedRef.current = ''
  }, [saveRecords])

  const getFilteredRecords = useCallback(
    (filters?: { symbol?: string; mode?: TradingMode; outcome?: 'win' | 'loss' | 'pending' }) => {
      if (!filters) return records
      return records.filter((r) => {
        if (filters.symbol && r.symbol !== filters.symbol) return false
        if (filters.mode && r.mode !== filters.mode) return false
        if (filters.outcome && r.outcome !== filters.outcome) return false
        return true
      })
    },
    [records],
  )

  return {
    records,
    stats,
    clearHistory,
    getFilteredRecords,
    totalRecords: records.length,
  }
}

/* ── Stats computation ────────────────────────────────────────────────────── */

function computeStats(records: SignalRecord[]): SignalHistoryStats {
  const resolved = records.filter((r) => r.outcome !== 'pending')
  const wins = resolved.filter((r) => r.outcome === 'win').length
  const losses = resolved.filter((r) => r.outcome === 'loss').length
  const pending = records.filter((r) => r.outcome === 'pending').length

  const bySymbol: Record<string, { wins: number; losses: number; total: number; winRate: number }> = {}
  const byMode: Record<string, { wins: number; losses: number; total: number; winRate: number }> = {}

  for (const r of resolved) {
    if (!bySymbol[r.symbol]) bySymbol[r.symbol] = { wins: 0, losses: 0, total: 0, winRate: 0 }
    bySymbol[r.symbol].total++
    if (r.outcome === 'win') bySymbol[r.symbol].wins++
    else bySymbol[r.symbol].losses++
    bySymbol[r.symbol].winRate = bySymbol[r.symbol].total > 0
      ? (bySymbol[r.symbol].wins / bySymbol[r.symbol].total) * 100
      : 0

    if (!byMode[r.mode]) byMode[r.mode] = { wins: 0, losses: 0, total: 0, winRate: 0 }
    byMode[r.mode].total++
    if (r.outcome === 'win') byMode[r.mode].wins++
    else byMode[r.mode].losses++
    byMode[r.mode].winRate = byMode[r.mode].total > 0
      ? (byMode[r.mode].wins / byMode[r.mode].total) * 100
      : 0
  }

  return {
    totalSignals: records.length,
    wins,
    losses,
    pending,
    winRate: resolved.length > 0 ? (wins / resolved.length) * 100 : 0,
    bySymbol,
    byMode,
  }
}
