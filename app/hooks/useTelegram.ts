'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SignalDirection } from '../lib/signalEngine'
import { getSymbolConfig, fmt } from '../lib/symbols'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface TelegramConfig {
  botToken: string
  chatId: string
  autoSend: boolean
  connected: boolean
}

const STORAGE_KEY = 'alpha-scanner-telegram-config'
const DEFAULT_CONFIG: TelegramConfig = {
  botToken: '',
  chatId: '',
  autoSend: false,
  connected: false,
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useTelegram() {
  const { isLoggedIn, serverData, loaded: syncLoaded, syncToServer } = useSettingsSyncContext()
  const [config, setConfig] = useState<TelegramConfig>(DEFAULT_CONFIG)
  const [sending, setSending] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const lastSentRef = useRef<string>('')
  const hydratedRef = useRef(false)

  // Load config: prefer server data for logged-in users, then localStorage
  useEffect(() => {
    if (!syncLoaded) return
    if (hydratedRef.current) return
    hydratedRef.current = true

    // Try localStorage first (always available)
    let local = DEFAULT_CONFIG
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) local = JSON.parse(raw) as TelegramConfig
    } catch { /* ignore */ }

    // If logged in with server data, override botToken/chatId from server
    if (isLoggedIn && serverData) {
      const merged: TelegramConfig = {
        ...local,
        botToken: serverData.telegramBotToken || local.botToken,
        chatId: serverData.telegramChatId || local.chatId,
      }
      setConfig(merged)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch { /* ignore */ }
    } else {
      setConfig(local)
    }
  }, [syncLoaded, isLoggedIn, serverData])

  // Persist config
  const updateConfig = useCallback((updates: Partial<TelegramConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }

      // Sync token/chatId to server if logged in
      if (isLoggedIn) {
        if (updates.botToken !== undefined) syncToServer('telegramBotToken', updates.botToken)
        if (updates.chatId !== undefined) syncToServer('telegramChatId', updates.chatId)
      }

      return updated
    })
  }, [isLoggedIn, syncToServer])

  // Send alert message
  const sendAlert = useCallback(async (message: string): Promise<boolean> => {
    if (!config.botToken || !config.chatId) return false

    setSending(true)
    setLastError(null)
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: config.botToken,
          chatId: config.chatId,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLastError(data.error || 'Send failed')
        return false
      }
      return true
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Send failed')
      return false
    } finally {
      setSending(false)
    }
  }, [config.botToken, config.chatId])

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!config.botToken || !config.chatId) return false

    setTestStatus('testing')
    setLastError(null)
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: config.botToken,
          chatId: config.chatId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTestStatus('error')
        setLastError(data.error || 'Test failed')
        updateConfig({ connected: false })
        return false
      }
      setTestStatus('success')
      updateConfig({ connected: true })
      return true
    } catch (err) {
      setTestStatus('error')
      setLastError(err instanceof Error ? err.message : 'Test failed')
      updateConfig({ connected: false })
      return false
    }
  }, [config.botToken, config.chatId, updateConfig])

  // Auto-send signal alert
  const sendSignalAlert = useCallback(
    async (
      symbol: string,
      direction: SignalDirection,
      confidence: number,
      entryPrice: number,
      tp1?: number,
      sl?: number,
    ) => {
      if (!config.autoSend || !config.connected) return
      if (direction === 'NEUTRAL') return

      // Dedup: don't send same signal twice
      const key = `${symbol}-${direction}`
      if (lastSentRef.current === key) return
      lastSentRef.current = key

      const cfg = getSymbolConfig(symbol)
      const icon = direction === 'BUY' ? '[BUY]' : '[SELL]'
      const arrow = direction === 'BUY' ? '^' : 'v'

      let message = `${icon} <b>${direction} Signal — ${cfg?.icon ?? ''} ${symbol}</b>\n\n`
      message += `${arrow} Direction: <b>${direction}</b>\n`
      message += `Confidence: <b>${confidence}%</b>\n`
      message += `Entry: <b>${fmt(symbol, entryPrice)}</b>\n`
      if (tp1) message += `TP1: <b>${fmt(symbol, tp1)}</b>\n`
      if (sl) message += `SL: <b>${fmt(symbol, sl)}</b>\n`
      message += `\n⏰ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      message += `\n\n<i>— Alpha Scanner</i>`

      await sendAlert(message)
    },
    [config.autoSend, config.connected, sendAlert],
  )

  return {
    config,
    sending,
    testStatus,
    lastError,
    updateConfig,
    sendAlert,
    testConnection,
    sendSignalAlert,
  }
}
