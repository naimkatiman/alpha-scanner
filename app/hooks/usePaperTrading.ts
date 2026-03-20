'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SignalDirection } from '../lib/signalEngine'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface PaperTrade {
  id: string
  symbol: string
  direction: 'buy' | 'sell'
  volume: number
  openPrice: number
  openTime: number
  closePrice?: number
  closeTime?: number
  profit?: number
}

export interface PaperAccount {
  balance: number
  initialBalance: number
  openTrades: PaperTrade[]
  tradeHistory: PaperTrade[]
}

export interface PaperStats {
  totalTrades: number
  winRate: number
  totalProfit: number
  avgProfit: number
  bestTrade: number
  worstTrade: number
}

export interface UsePaperTradingReturn {
  enabled: boolean
  autoTrade: boolean
  account: PaperAccount
  equity: number
  unrealizedPL: number
  stats: PaperStats
  lotSize: number
  setLotSize: (size: number) => void
  toggleEnabled: () => void
  toggleAutoTrade: () => void
  openTrade: (symbol: string, direction: 'buy' | 'sell', price: number) => void
  closeTrade: (tradeId: string, price: number) => void
  closeAllTrades: (prices: Record<string, number>) => void
  resetAccount: () => void
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'alpha_scanner_paper'
const INITIAL_BALANCE = 10_000

function generateId(): string {
  return 'pt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

function loadAccount(): PaperAccount {
  if (typeof window === 'undefined') return defaultAccount()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PaperAccount
  } catch {
    // Reset on corruption
  }
  return defaultAccount()
}

function defaultAccount(): PaperAccount {
  return {
    balance: INITIAL_BALANCE,
    initialBalance: INITIAL_BALANCE,
    openTrades: [],
    tradeHistory: [],
  }
}

function saveAccount(account: PaperAccount): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...account,
    tradeHistory: account.tradeHistory.slice(0, 100), // Keep last 100
  }))
}

function calcTradeProfit(trade: PaperTrade, currentPrice: number): number {
  const diff = trade.direction === 'buy'
    ? currentPrice - trade.openPrice
    : trade.openPrice - currentPrice
  // Simplified: profit = diff × volume × 100000 (forex standard lot)
  // For crypto/metals, we use a simpler multiplier
  return diff * trade.volume * 100
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function usePaperTrading(
  prices: Record<string, { price: number }> | null,
  signalDirection?: SignalDirection,
  selectedSymbol?: string,
): UsePaperTradingReturn {
  const [enabled, setEnabled] = useState(false)
  const [autoTrade, setAutoTrade] = useState(false)
  const [account, setAccount] = useState<PaperAccount>(defaultAccount())
  const [lotSize, setLotSize] = useState(0.01)
  const prevDirection = useRef<SignalDirection | null>(null)

  // Load from localStorage
  useEffect(() => {
    const saved = loadAccount()
    setAccount(saved)
    const enabledSaved = localStorage.getItem('alpha_scanner_paper_enabled')
    if (enabledSaved === 'true') setEnabled(true)
    const autoSaved = localStorage.getItem('alpha_scanner_paper_autotrade')
    if (autoSaved === 'true') setAutoTrade(true)
  }, [])

  // Calculate unrealized P&L
  const unrealizedPL = account.openTrades.reduce((sum, trade) => {
    const price = prices?.[trade.symbol]?.price ?? trade.openPrice
    return sum + calcTradeProfit(trade, price)
  }, 0)

  const equity = account.balance + unrealizedPL

  // Auto-trade on signal changes
  useEffect(() => {
    if (!enabled || !autoTrade || !signalDirection || !selectedSymbol || !prices) return

    if (
      prevDirection.current &&
      prevDirection.current !== signalDirection &&
      signalDirection !== 'NEUTRAL'
    ) {
      const price = prices[selectedSymbol]?.price
      if (price) {
        const dir = signalDirection === 'BUY' ? 'buy' as const : 'sell' as const
        // Check if already have a trade in same direction
        const existing = account.openTrades.find(
          (t) => t.symbol === selectedSymbol && t.direction === dir,
        )
        if (!existing) {
          openTrade(selectedSymbol, dir, price)
        }
      }
    }
    prevDirection.current = signalDirection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalDirection, enabled, autoTrade, selectedSymbol])

  const openTrade = useCallback((symbol: string, direction: 'buy' | 'sell', price: number) => {
    setAccount((prev) => {
      const trade: PaperTrade = {
        id: generateId(),
        symbol,
        direction,
        volume: lotSize,
        openPrice: price,
        openTime: Date.now(),
      }
      const updated = {
        ...prev,
        openTrades: [...prev.openTrades, trade],
      }
      saveAccount(updated)
      return updated
    })
  }, [lotSize])

  const closeTrade = useCallback((tradeId: string, price: number) => {
    setAccount((prev) => {
      const trade = prev.openTrades.find((t) => t.id === tradeId)
      if (!trade) return prev

      const profit = calcTradeProfit(trade, price)
      const closedTrade: PaperTrade = {
        ...trade,
        closePrice: price,
        closeTime: Date.now(),
        profit,
      }

      const updated = {
        ...prev,
        balance: prev.balance + profit,
        openTrades: prev.openTrades.filter((t) => t.id !== tradeId),
        tradeHistory: [closedTrade, ...prev.tradeHistory],
      }
      saveAccount(updated)
      return updated
    })
  }, [])

  const closeAllTrades = useCallback((currentPrices: Record<string, number>) => {
    setAccount((prev) => {
      let totalPL = 0
      const closedTrades: PaperTrade[] = prev.openTrades.map((trade) => {
        const price = currentPrices[trade.symbol] ?? trade.openPrice
        const profit = calcTradeProfit(trade, price)
        totalPL += profit
        return { ...trade, closePrice: price, closeTime: Date.now(), profit }
      })

      const updated = {
        ...prev,
        balance: prev.balance + totalPL,
        openTrades: [],
        tradeHistory: [...closedTrades, ...prev.tradeHistory],
      }
      saveAccount(updated)
      return updated
    })
  }, [])

  const resetAccount = useCallback(() => {
    const fresh = defaultAccount()
    setAccount(fresh)
    saveAccount(fresh)
  }, [])

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      localStorage.setItem('alpha_scanner_paper_enabled', String(!prev))
      return !prev
    })
  }, [])

  const toggleAutoTrade = useCallback(() => {
    setAutoTrade((prev) => {
      localStorage.setItem('alpha_scanner_paper_autotrade', String(!prev))
      return !prev
    })
  }, [])

  // Compute stats
  const closedTrades = account.tradeHistory.filter((t) => t.profit !== undefined)
  const wins = closedTrades.filter((t) => (t.profit ?? 0) > 0)
  const profits = closedTrades.map((t) => t.profit ?? 0)

  const stats: PaperStats = {
    totalTrades: closedTrades.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalProfit: profits.reduce((s, p) => s + p, 0),
    avgProfit: profits.length > 0 ? profits.reduce((s, p) => s + p, 0) / profits.length : 0,
    bestTrade: profits.length > 0 ? Math.max(...profits) : 0,
    worstTrade: profits.length > 0 ? Math.min(...profits) : 0,
  }

  return {
    enabled,
    autoTrade,
    account,
    equity,
    unrealizedPL,
    stats,
    lotSize,
    setLotSize,
    toggleEnabled,
    toggleAutoTrade,
    openTrade,
    closeTrade,
    closeAllTrades,
    resetAccount,
  }
}
