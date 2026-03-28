'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface EquitySnapshot {
  timestamp: number
  equity: number
  balance: number
  unrealizedPL: number
  trades: number
}

export interface PerformanceMetrics {
  currentEquity: number
  peakEquity: number
  maxDrawdown: number
  maxDrawdownPct: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  totalPL: number
  totalPLPct: number
  winStreak: number
  lossStreak: number
  currentStreak: number
  bySymbol: Record<string, { profit: number; trades: number }>
  byMode: Record<string, { profit: number; trades: number }>
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const EQUITY_STORAGE_KEY = 'alpha-scanner-equity-curve'
const TRADES_STORAGE_KEY = 'alpha-scanner-trade-results'
const MAX_SNAPSHOTS = 365
const INITIAL_BALANCE = 10000

/* ── Trade result (from paper trading) ────────────────────────────────────── */

export interface TradeResult {
  id: string
  symbol: string
  mode: string
  direction: 'buy' | 'sell'
  openPrice: number
  closePrice: number
  profit: number
  openTime: number
  closeTime: number
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function usePerformanceAnalytics(
  currentEquity: number,
  currentBalance: number,
  unrealizedPL: number,
) {
  const { isLoggedIn, serverData, loaded: syncLoaded, syncToServer } = useSettingsSyncContext()
  const [snapshots, setSnapshots] = useState<EquitySnapshot[]>([])
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([])
  const hydratedRef = useRef(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced sync for snapshots (changes daily)
  const debouncedSyncSnapshots = useCallback((data: EquitySnapshot[]) => {
    if (!isLoggedIn) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      syncToServer('equitySnapshots', data)
    }, 3000)
  }, [isLoggedIn, syncToServer])

  const syncTradeResults = useCallback((data: TradeResult[]) => {
    if (!isLoggedIn) return
    syncToServer('tradeRecords', data)
  }, [isLoggedIn, syncToServer])

  // Load from localStorage, overlay server data if logged in
  useEffect(() => {
    if (!syncLoaded) return
    if (hydratedRef.current) return
    hydratedRef.current = true

    let localSnaps: EquitySnapshot[] = []
    let localTrades: TradeResult[] = []
    try {
      const storedSnaps = localStorage.getItem(EQUITY_STORAGE_KEY)
      if (storedSnaps) localSnaps = JSON.parse(storedSnaps)
      const storedTrades = localStorage.getItem(TRADES_STORAGE_KEY)
      if (storedTrades) localTrades = JSON.parse(storedTrades)
    } catch { /* ignore */ }

    if (isLoggedIn && serverData) {
      const serverSnaps = serverData.equitySnapshots as EquitySnapshot[]
      const serverTrades = serverData.tradeRecords as TradeResult[]
      setSnapshots(serverSnaps.length > 0 ? serverSnaps : localSnaps)
      setTradeResults(serverTrades.length > 0 ? serverTrades : localTrades)
    } else {
      setSnapshots(localSnaps)
      setTradeResults(localTrades)
    }
  }, [syncLoaded, isLoggedIn, serverData])

  // Take daily equity snapshot
  useEffect(() => {
    if (currentEquity <= 0) return

    const now = Date.now()
    const todayStart = new Date().setHours(0, 0, 0, 0)

    setSnapshots((prev) => {
      const existingToday = prev.find((s) => s.timestamp >= todayStart)
      let updated: EquitySnapshot[]

      if (existingToday) {
        updated = prev.map((s) =>
          s.timestamp >= todayStart
            ? { ...s, equity: currentEquity, balance: currentBalance, unrealizedPL, timestamp: now }
            : s,
        )
      } else {
        updated = [
          ...prev,
          {
            timestamp: now,
            equity: currentEquity,
            balance: currentBalance,
            unrealizedPL,
            trades: tradeResults.length,
          },
        ].slice(-MAX_SNAPSHOTS)
      }

      try {
        localStorage.setItem(EQUITY_STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }
      debouncedSyncSnapshots(updated)
      return updated
    })
  }, [currentEquity, currentBalance, unrealizedPL, tradeResults.length, debouncedSyncSnapshots])

  // Record trade result
  const recordTrade = useCallback((trade: TradeResult) => {
    setTradeResults((prev) => {
      if (prev.some((t) => t.id === trade.id)) return prev
      const updated = [...prev, trade].slice(-1000)
      try {
        localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }
      syncTradeResults(updated)
      return updated
    })
  }, [syncTradeResults])

  const metrics = computeMetrics(snapshots, tradeResults)

  const resetAnalytics = useCallback(() => {
    setSnapshots([])
    setTradeResults([])
    try {
      localStorage.removeItem(EQUITY_STORAGE_KEY)
      localStorage.removeItem(TRADES_STORAGE_KEY)
    } catch { /* ignore */ }
    if (isLoggedIn) {
      syncToServer('equitySnapshots', [])
      syncToServer('tradeRecords', [])
    }
  }, [isLoggedIn, syncToServer])

  return {
    snapshots,
    tradeResults,
    metrics,
    recordTrade,
    resetAnalytics,
  }
}

/* ── Metrics computation ──────────────────────────────────────────────────── */

function computeMetrics(
  snapshots: EquitySnapshot[],
  trades: TradeResult[],
): PerformanceMetrics {
  const wins = trades.filter((t) => t.profit > 0)
  const losses = trades.filter((t) => t.profit <= 0)

  const grossProfit = wins.reduce((sum, t) => sum + t.profit, 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0))
  const totalPL = trades.reduce((sum, t) => sum + t.profit, 0)

  let peakEquity = INITIAL_BALANCE
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  const currentEquity = snapshots.length > 0 ? snapshots[snapshots.length - 1].equity : INITIAL_BALANCE

  for (const snap of snapshots) {
    if (snap.equity > peakEquity) peakEquity = snap.equity
    const drawdown = peakEquity - snap.equity
    const drawdownPct = peakEquity > 0 ? (drawdown / peakEquity) * 100 : 0
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      maxDrawdownPct = drawdownPct
    }
  }

  let winStreak = 0
  let lossStreak = 0
  let currentStreak = 0
  let tempWin = 0
  let tempLoss = 0
  for (const t of trades) {
    if (t.profit > 0) {
      tempWin++
      tempLoss = 0
      currentStreak = tempWin
    } else {
      tempLoss++
      tempWin = 0
      currentStreak = -tempLoss
    }
    if (tempWin > winStreak) winStreak = tempWin
    if (tempLoss > lossStreak) lossStreak = tempLoss
  }

  const bySymbol: Record<string, { profit: number; trades: number }> = {}
  const byMode: Record<string, { profit: number; trades: number }> = {}

  for (const t of trades) {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { profit: 0, trades: 0 }
    bySymbol[t.symbol].profit += t.profit
    bySymbol[t.symbol].trades++

    if (!byMode[t.mode]) byMode[t.mode] = { profit: 0, trades: 0 }
    byMode[t.mode].profit += t.profit
    byMode[t.mode].trades++
  }

  return {
    currentEquity,
    peakEquity,
    maxDrawdown,
    maxDrawdownPct,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    avgWin: wins.length > 0 ? grossProfit / wins.length : 0,
    avgLoss: losses.length > 0 ? grossLoss / losses.length : 0,
    largestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.profit)) : 0,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.profit)) : 0,
    totalPL,
    totalPLPct: INITIAL_BALANCE > 0 ? (totalPL / INITIAL_BALANCE) * 100 : 0,
    winStreak,
    lossStreak,
    currentStreak,
    bySymbol,
    byMode,
  }
}
