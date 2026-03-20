'use client'

import { useState } from 'react'
import type { AlertConfig } from '../lib/alertEngine'
import { getAllSymbols } from '../lib/symbols'

interface AlertsPanelProps {
  watchlist: string[]
  alerts: AlertConfig[]
  notificationsEnabled: boolean
  onToggleWatch: (symbol: string) => void
  onClearAlerts: () => void
  onEnableNotifications: () => Promise<void>
}

export default function AlertsPanel({
  watchlist,
  alerts,
  notificationsEnabled,
  onToggleWatch,
  onClearAlerts,
  onEnableNotifications,
}: AlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [tab, setTab] = useState<'watchlist' | 'history'>('watchlist')
  const allSymbols = getAllSymbols()

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#111] overflow-hidden"
      style={{ borderTopColor: '#a1a1aa', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Signal Alerts</h3>
          <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
            {alerts.length}
          </span>
          {alerts.length > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#a1a1aa] animate-pulse" />
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06]">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setTab('watchlist')}
              className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: tab === 'watchlist' ? '#a1a1aa' : '#4b5563',
                borderBottom: tab === 'watchlist' ? '2px solid #a1a1aa' : '2px solid transparent',
              }}
            >
              Watchlist ({watchlist.length})
            </button>
            <button
              onClick={() => setTab('history')}
              className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: tab === 'history' ? '#a1a1aa' : '#4b5563',
                borderBottom: tab === 'history' ? '2px solid #a1a1aa' : '2px solid transparent',
              }}
            >
              History ({alerts.length})
            </button>
          </div>

          {tab === 'watchlist' ? (
            <div className="p-4 sm:p-5 space-y-3">
              {/* Notification toggle */}
              <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg></span>
                  <span className="text-[10px] text-gray-400">Desktop Notifications</span>
                </div>
                {notificationsEnabled ? (
                  <span className="text-[9px] font-semibold text-[#22c55e] uppercase">Enabled</span>
                ) : (
                  <button
                    onClick={onEnableNotifications}
                    className="rounded bg-[#a1a1aa]/10 px-2 py-1 text-[9px] font-semibold text-[#a1a1aa] transition-colors hover:bg-[#a1a1aa]/20"
                  >
                    Enable
                  </button>
                )}
              </div>

              {/* Symbol toggles */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {allSymbols.map((cfg) => {
                  const isWatched = watchlist.includes(cfg.symbol)
                  return (
                    <button
                      key={cfg.symbol}
                      onClick={() => onToggleWatch(cfg.symbol)}
                      className="rounded border px-2 py-2 text-[10px] font-semibold transition-all duration-150 active:scale-95"
                      style={{
                        borderColor: isWatched ? 'rgba(245,158,11,0.5)' : '#222',
                        backgroundColor: isWatched ? 'rgba(245,158,11,0.1)' : '#1a1a1a',
                        color: isWatched ? '#fbbf24' : '#6b7280',
                      }}
                    >
                      
                      {cfg.symbol.replace('USD', '')}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-2">
              {alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mb-2 opacity-30"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><line x1="1" y1="1" x2="23" y2="23" /></svg></div>
                  <p className="text-xs text-gray-500">No alerts yet</p>
                  <p className="mt-0.5 text-[9px] text-gray-700">
                    Add symbols to your watchlist to receive alerts
                  </p>
                </div>
              ) : (
                <>
                  {alerts.slice(0, 20).map((alert, i) => (
                    <AlertRow key={`${alert.symbol}-${alert.timestamp}-${i}`} alert={alert} />
                  ))}
                  {alerts.length > 0 && (
                    <button
                      onClick={onClearAlerts}
                      className="w-full rounded border border-white/[0.06] bg-white/[0.03] py-2 text-[9px] text-gray-600 transition-colors hover:text-gray-400 hover:border-gray-500"
                    >
                      Clear All
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertRow({ alert }: { alert: AlertConfig }) {
  const dirColor = alert.newDirection === 'BUY' ? '#10b981' : '#f43f5e'
  const time = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.05]">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: dirColor }}
        />
        <span className="text-xs font-semibold text-white">{alert.symbol}</span>
        <span className="text-[9px] text-gray-600">
          {alert.previousDirection} →{' '}
          <span style={{ color: dirColor }} className="font-semibold">
            {alert.newDirection}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[9px] text-gray-700 capitalize">{alert.mode}</span>
        <span className="font-mono text-[9px] text-gray-600">{time}</span>
      </div>
    </div>
  )
}

/* ── Toast notification ───────────────────────────────────────────────────── */

export function AlertToast({
  alert,
  onDismiss,
}: {
  alert: AlertConfig | null
  onDismiss: () => void
}) {
  if (!alert) return null

  const dirColor = alert.newDirection === 'BUY' ? '#10b981' : '#f43f5e'
  return (
    <div
      className="fixed top-20 right-4 z-[60] max-w-sm animate-slide-in-right"
      role="alert"
    >
      <div
        className="flex items-center gap-3 rounded-lg border bg-[#111] px-4 py-3 shadow-xl"
        style={{ borderColor: `${dirColor}40` }}
      >
        <span
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: dirColor, boxShadow: `0 0 8px ${dirColor}60` }}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white">
            {alert.symbol} — {alert.newDirection}
          </p>
          <p className="text-[9px] text-gray-500">
            Signal changed from {alert.previousDirection} ({alert.mode})
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded p-1 text-gray-600 hover:text-gray-300 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
