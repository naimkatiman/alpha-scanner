/* ── Signal Alert Engine ──────────────────────────────────────────────────── */
// Detects signal direction changes and fires alerts.

import type { SignalDirection } from './signalEngine'

export interface AlertConfig {
  symbol: string
  previousDirection: SignalDirection
  newDirection: SignalDirection
  timestamp: number
  mode: string
}

/* ── Direction change detection ───────────────────────────────────────────── */

const previousDirections = new Map<string, SignalDirection>()

export function detectDirectionChange(
  symbol: string,
  mode: string,
  newDirection: SignalDirection,
): AlertConfig | null {
  const key = `${symbol}:${mode}`
  const prev = previousDirections.get(key) ?? null

  if (prev && prev !== newDirection && newDirection !== 'NEUTRAL') {
    const alert: AlertConfig = {
      symbol,
      previousDirection: prev,
      newDirection,
      timestamp: Date.now(),
      mode,
    }
    previousDirections.set(key, newDirection)
    return alert
  }

  previousDirections.set(key, newDirection)
  return null
}

/* ── Browser Notification ─────────────────────────────────────────────────── */

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission)
  }
  return Notification.requestPermission()
}

export function sendDesktopNotification(alert: AlertConfig): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const emoji = alert.newDirection === 'BUY' ? '[BUY]' : '[SELL]'
  const title = `${emoji} ${alert.symbol} — ${alert.newDirection}`
  const body = `Signal changed from ${alert.previousDirection} to ${alert.newDirection} (${alert.mode})`

  new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: `alert-${alert.symbol}-${alert.mode}`,
    silent: false,
  })
}

/* ── Watchlist persistence ────────────────────────────────────────────────── */

const WATCHLIST_KEY = 'alpha_scanner_watchlist'
const ALERTS_KEY = 'alpha_scanner_alerts'

export function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveWatchlist(symbols: string[], onSync?: (value: string[]) => void): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols))
  onSync?.(symbols)
}

export function loadAlertHistory(): AlertConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    return raw ? (JSON.parse(raw) as AlertConfig[]) : []
  } catch {
    return []
  }
}

export function saveAlertHistory(alerts: AlertConfig[]): void {
  if (typeof window === 'undefined') return
  // Keep last 50 alerts
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 50)))
}
