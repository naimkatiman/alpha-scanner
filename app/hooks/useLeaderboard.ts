'use client'

import { useState, useEffect, useCallback } from 'react'

export type LeaderboardEntry = {
  symbol: string
  mode: string
  total: number
  wins: number
  losses: number
  winRate: number
  currentStreak: number
  bestStreak: number
}

export type LeaderboardSummary = {
  totalSignals: number
  overallWinRate: number
  mostAccurate: string | null
}

export type Period = 'weekly' | 'monthly' | 'all'

type LeaderboardResponse = {
  data: LeaderboardEntry[]
  summary: LeaderboardSummary
  period: Period
}

export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [summary, setSummary] = useState<LeaderboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('all')

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leaderboard?period=${period}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: LeaderboardResponse = await res.json()
      setData(json.data)
      setSummary(json.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 60_000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  return { data, summary, loading, error, period, setPeriod }
}
