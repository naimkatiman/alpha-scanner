'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchWithRetry } from '@/app/lib/fetchWithRetry'
import type { AlertConfig } from '../lib/alertEngine'
import type { SignalDirection } from '../lib/signalEngine'
import {
  loadWatchlist,
  saveWatchlist,
  loadAlertHistory,
  saveAlertHistory,
  detectDirectionChange,
  sendDesktopNotification,
  requestNotificationPermission,
} from '../lib/alertEngine'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

export interface UseAlertsReturn {
  watchlist: string[]
  alerts: AlertConfig[]
  toastAlert: AlertConfig | null
  notificationsEnabled: boolean
  retryCount: number
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleWatchlist: (symbol: string) => void
  clearAlerts: () => void
  enableNotifications: () => Promise<void>
  dismissToast: () => void
}

export function useAlerts(currentMode: string): UseAlertsReturn {
  const { isLoggedIn, serverData, loaded: syncLoaded, syncToServer } = useSettingsSyncContext()
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [toastAlert, setToastAlert] = useState<AlertConfig | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [retryCount] = useState(0)
  const prevSignals = useRef<Map<string, SignalDirection>>(new Map())
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPollingRef = useRef(false)
  const hydratedRef = useRef(false)

  // Load from localStorage, then overlay server data if logged in
  useEffect(() => {
    if (!syncLoaded) return
    if (hydratedRef.current) return
    hydratedRef.current = true

    const localWatchlist = loadWatchlist()
    setAlerts(loadAlertHistory())

    if (isLoggedIn && serverData && serverData.alertWatchlist.length > 0) {
      setWatchlist(serverData.alertWatchlist)
    } else {
      setWatchlist(localWatchlist)
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [syncLoaded, isLoggedIn, serverData])

  // Poll watched symbols for signal changes
  useEffect(() => {
    if (watchlist.length === 0) return

    const pollSignals = async () => {
      if (isPollingRef.current) return
      isPollingRef.current = true
      try {
        for (const symbol of watchlist) {
          try {
            const params = new URLSearchParams({ symbol, mode: currentMode, risk: 'balanced' })
            const res = await fetchWithRetry(`/api/signals?${params.toString()}`)
            if (!res.ok) continue
            const data = await res.json() as { signal: { direction: SignalDirection } }
            const dir = data.signal.direction

            const alert = detectDirectionChange(symbol, currentMode, dir)
            if (alert) {
              setAlerts((prev) => {
                const updated = [alert, ...prev].slice(0, 50)
                saveAlertHistory(updated)
                return updated
              })

              setToastAlert(alert)
              if (toastTimer.current) clearTimeout(toastTimer.current)
              toastTimer.current = setTimeout(() => setToastAlert(null), 5000)

              if (notificationsEnabled) {
                sendDesktopNotification(alert)
              }
            }

            prevSignals.current.set(`${symbol}:${currentMode}`, dir)
          } catch {
            // Skip failed fetches
          }
        }
      } finally {
        isPollingRef.current = false
      }
    }

    void pollSignals()
    const interval = setInterval(() => void pollSignals(), 30_000)
    return () => clearInterval(interval)
  }, [watchlist, currentMode, notificationsEnabled])

  const persistWatchlist = useCallback((updated: string[]) => {
    saveWatchlist(updated)
    if (isLoggedIn) syncToServer('alertWatchlist', updated)
  }, [isLoggedIn, syncToServer])

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) return prev
      const updated = [...prev, symbol]
      persistWatchlist(updated)
      return updated
    })
  }, [persistWatchlist])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((s) => s !== symbol)
      persistWatchlist(updated)
      return updated
    })
  }, [persistWatchlist])

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const updated = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
      persistWatchlist(updated)
      return updated
    })
  }, [persistWatchlist])

  const clearAlerts = useCallback(() => {
    setAlerts([])
    saveAlertHistory([])
  }, [])

  const enableNotifications = useCallback(async () => {
    const perm = await requestNotificationPermission()
    setNotificationsEnabled(perm === 'granted')
  }, [])

  const dismissToast = useCallback(() => {
    setToastAlert(null)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  return {
    watchlist,
    alerts,
    toastAlert,
    notificationsEnabled,
    retryCount,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    clearAlerts,
    enableNotifications,
    dismissToast,
  }
}
