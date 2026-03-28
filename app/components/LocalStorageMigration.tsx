'use client'

import { useState, useEffect } from 'react'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

const MIGRATION_KEY = 'alpha_scanner_migrated'

const LOCAL_KEYS = {
  alertWatchlist: 'alpha_scanner_watchlist',
  alertRules: 'alpha-scanner-alert-rules',
  paperTradingState: 'alpha_scanner_paper',
  signalHistory: 'alpha-scanner-signal-history',
  equitySnapshots: 'alpha-scanner-equity-curve',
  tradeRecords: 'alpha-scanner-trade-results',
  telegramConfig: 'alpha-scanner-telegram-config',
} as const

function hasLocalData(): boolean {
  for (const key of Object.values(LOCAL_KEYS)) {
    const raw = localStorage.getItem(key)
    if (raw && raw !== '[]' && raw !== 'null') return true
  }
  return false
}

function collectLocalData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const parse = (key: string, fallback: unknown = []) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  const watchlist = parse(LOCAL_KEYS.alertWatchlist, [])
  if (Array.isArray(watchlist) && watchlist.length > 0) data.alertWatchlist = watchlist

  const rules = parse(LOCAL_KEYS.alertRules, [])
  if (Array.isArray(rules) && rules.length > 0) data.alertRules = rules

  const paper = parse(LOCAL_KEYS.paperTradingState, null)
  if (paper && typeof paper === 'object') data.paperTradingState = paper

  const signals = parse(LOCAL_KEYS.signalHistory, [])
  if (Array.isArray(signals) && signals.length > 0) data.signalHistory = signals

  const equity = parse(LOCAL_KEYS.equitySnapshots, [])
  if (Array.isArray(equity) && equity.length > 0) data.equitySnapshots = equity

  const trades = parse(LOCAL_KEYS.tradeRecords, [])
  if (Array.isArray(trades) && trades.length > 0) data.tradeRecords = trades

  // Telegram config
  const tgConfig = parse(LOCAL_KEYS.telegramConfig, null)
  if (tgConfig && typeof tgConfig === 'object') {
    const tg = tgConfig as { botToken?: string; chatId?: string }
    if (tg.botToken) data.telegramBotToken = tg.botToken
    if (tg.chatId) data.telegramChatId = tg.chatId
  }

  return data
}

export default function LocalStorageMigration() {
  const { isLoggedIn, loaded, syncBatch, serverData } = useSettingsSyncContext()
  const [show, setShow] = useState(false)
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    if (!loaded || !isLoggedIn) return
    if (typeof window === 'undefined') return

    // Already migrated
    if (localStorage.getItem(MIGRATION_KEY) === 'true') return

    // Check if server already has data (not a fresh account)
    const serverHasData = serverData && (
      (serverData.alertWatchlist as unknown[]).length > 0 ||
      (serverData.signalHistory as unknown[]).length > 0 ||
      serverData.paperTradingState !== null
    )
    if (serverHasData) {
      localStorage.setItem(MIGRATION_KEY, 'true')
      return
    }

    // Check if there's local data worth migrating
    if (hasLocalData()) {
      setShow(true)
    } else {
      localStorage.setItem(MIGRATION_KEY, 'true')
    }
  }, [loaded, isLoggedIn, serverData])

  const handleImport = async () => {
    setMigrating(true)
    const data = collectLocalData()
    const success = await syncBatch(data as Parameters<typeof syncBatch>[0])
    if (success) {
      localStorage.setItem(MIGRATION_KEY, 'true')
      setShow(false)
    }
    setMigrating(false)
  }

  const handleSkip = () => {
    localStorage.setItem(MIGRATION_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border border-emerald-500/20 bg-[#0a0a0a]/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Import Local Data</h3>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-zinc-400">
          We found trading data saved on this device. Import it to your account so it syncs across devices?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={migrating}
            className="flex-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {migrating ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={handleSkip}
            disabled={migrating}
            className="flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
