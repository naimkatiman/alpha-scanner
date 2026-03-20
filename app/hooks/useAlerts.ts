'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

export interface UseAlertsReturn {
  watchlist: string[]
  alerts: AlertConfig[]
  toastAlert: AlertConfig | null
  notificationsEnabled: boolean
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleWatchlist: (symbol: string) => void
  clearAlerts: () => void
  enableNotifications: () => Promise<void>
  dismissToast: () => void
}

export function useAlerts(currentMode: string): UseAlertsReturn {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [toastAlert, setToastAlert] = useState<AlertConfig | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const prevSignals = useRef<Map<string, SignalDirection>>(new Map())
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage
  useEffect(() => {
    setWatchlist(loadWatchlist())
    setAlerts(loadAlertHistory())
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  // Poll watched symbols for signal changes
  useEffect(() => {
    if (watchlist.length === 0) return

    const pollSignals = async () => {
      for (const symbol of watchlist) {
        try {
          const params = new URLSearchParams({ symbol, mode: currentMode, risk: 'balanced' })
          const res = await fetch(`/api/signals?${params.toString()}`)
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

            // Toast
            setToastAlert(alert)
            if (toastTimer.current) clearTimeout(toastTimer.current)
            toastTimer.current = setTimeout(() => setToastAlert(null), 5000)

            // Desktop notification
            if (notificationsEnabled) {
              sendDesktopNotification(alert)
            }
          }

          prevSignals.current.set(`${symbol}:${currentMode}`, dir)
        } catch {
          // Skip failed fetches
        }
      }
    }

    void pollSignals()
    const interval = setInterval(pollSignals, 30_000)
    return () => clearInterval(interval)
  }, [watchlist, currentMode, notificationsEnabled])

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) return prev
      const updated = [...prev, symbol]
      saveWatchlist(updated)
      return updated
    })
  }, [])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((s) => s !== symbol)
      saveWatchlist(updated)
      return updated
    })
  }, [])

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const updated = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
      saveWatchlist(updated)
      return updated
    })
  }, [])

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
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    clearAlerts,
    enableNotifications,
    dismissToast,
  }
}
