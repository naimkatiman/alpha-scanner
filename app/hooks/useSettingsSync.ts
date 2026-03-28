'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, useRef } from 'react'

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline'

export type SyncableKey =
  | 'watchlist'
  | 'alertWatchlist'
  | 'alertRules'
  | 'paperTradingState'
  | 'signalHistory'
  | 'equitySnapshots'
  | 'tradeRecords'
  | 'telegramBotToken'
  | 'telegramChatId'
  | 'preferredMode'
  | 'riskProfile'
  | 'leverage'
  | 'capital'

export interface ServerSettings {
  watchlist: string[]
  preferredMode: string
  riskProfile: string
  leverage: number
  capital: number
  telegramBotToken: string | null
  telegramChatId: string | null
  alertWatchlist: string[]
  alertRules: unknown[]
  paperTradingState: unknown | null
  signalHistory: unknown[]
  equitySnapshots: unknown[]
  tradeRecords: unknown[]
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const DEBOUNCE_MS = 800

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useSettingsSync() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isLoggedIn ? 'synced' : 'offline')
  const [serverData, setServerData] = useState<ServerSettings | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const pendingWrites = useRef<Record<string, unknown>>({})
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFetching = useRef(false)

  // Fetch all settings from server on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setSyncStatus('offline')
      setLoaded(true)
      return
    }

    if (isFetching.current) return
    isFetching.current = true

    fetch('/api/settings')
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((data: ServerSettings) => {
        setServerData(data)
        setSyncStatus('synced')
        setLastSyncTime(Date.now())
        setLoaded(true)
      })
      .catch(() => {
        setSyncStatus('error')
        setLoaded(true)
      })
      .finally(() => {
        isFetching.current = false
      })
  }, [isLoggedIn])

  // Flush pending writes to server
  const flushToServer = useCallback(() => {
    const payload = { ...pendingWrites.current }
    pendingWrites.current = {}

    if (Object.keys(payload).length === 0) return

    setSyncStatus('syncing')

    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error('save failed')
        return r.json()
      })
      .then((data: ServerSettings) => {
        setServerData(data)
        setSyncStatus('synced')
        setLastSyncTime(Date.now())
      })
      .catch(() => {
        setSyncStatus('error')
      })
  }, [])

  // Debounced sync to server — batches multiple key updates
  const syncToServer = useCallback(
    (key: SyncableKey, value: unknown) => {
      if (!isLoggedIn) return

      pendingWrites.current[key] = value

      // Update local server data optimistically
      setServerData((prev) => (prev ? { ...prev, [key]: value } : prev))

      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(flushToServer, DEBOUNCE_MS)
    },
    [isLoggedIn, flushToServer],
  )

  // Batch sync — for migration, syncs multiple keys at once
  const syncBatch = useCallback(
    (data: Partial<Record<SyncableKey, unknown>>) => {
      if (!isLoggedIn) return Promise.resolve(false)

      setSyncStatus('syncing')
      return fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((r) => {
          if (!r.ok) throw new Error('save failed')
          return r.json()
        })
        .then((resp: ServerSettings) => {
          setServerData(resp)
          setSyncStatus('synced')
          setLastSyncTime(Date.now())
          return true
        })
        .catch(() => {
          setSyncStatus('error')
          return false
        })
    },
    [isLoggedIn],
  )

  return {
    isLoggedIn,
    syncStatus,
    serverData,
    lastSyncTime,
    loaded,
    syncToServer,
    syncBatch,
  }
}
