'use client'

import { useState } from 'react'
import type { BrokerState } from '../hooks/useBroker'
import type { BrokerAccount } from '../lib/brokerApi'

interface BrokerConnectProps {
  state: BrokerState
  account: BrokerAccount | null
  error: string | null
  onConnect: (token: string, accountId: string) => Promise<void>
  onDisconnect: () => Promise<void>
}

const STATE_CONFIG: Record<BrokerState, { dot: string; label: string; color: string }> = {
  disconnected: { dot: 'bg-gray-500', label: 'Disconnected', color: '#6b7280' },
  connecting: { dot: 'bg-yellow-400 animate-pulse', label: 'Connecting…', color: '#f59e0b' },
  connected: { dot: 'bg-[#22c55e]', label: 'Connected', color: '#22c55e' },
  error: { dot: 'bg-[#ef4444]', label: 'Error', color: '#ef4444' },
}

export default function BrokerConnect({
  state,
  account,
  error,
  onConnect,
  onDisconnect,
}: BrokerConnectProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [token, setToken] = useState('')
  const [accountId, setAccountId] = useState('')

  const cfg = STATE_CONFIG[state]

  const handleConnect = async () => {
    if (!token.trim() || !accountId.trim()) return
    await onConnect(token.trim(), accountId.trim())
  }

  const handleDisconnect = async () => {
    await onDisconnect()
    setToken('')
    setAccountId('')
  }

  return (
    <div className="rounded-lg border border-[#222] bg-[#111] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#1a1a1a]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm" aria-hidden="true">🔗</span>
          <span className="text-xs font-semibold text-white truncate">Broker</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          <span className="text-[9px] uppercase tracking-wider" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#222] px-3 py-3 space-y-3">
          {state === 'connected' && account ? (
            <>
              {/* Account info */}
              <div className="rounded border border-[#222] bg-[#1a1a1a] p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-gray-600">Account</span>
                  <span className="text-[9px] font-semibold text-gray-400 uppercase">
                    {account.platform}
                  </span>
                </div>
                <div className="text-xs text-white font-medium truncate">{account.name}</div>
                <div className="text-[9px] text-gray-600 truncate">{account.server}</div>
              </div>

              <AccountInfoCompact account={account} />

              <button
                onClick={handleDisconnect}
                className="w-full rounded border border-[#ef4444]/30 bg-[#ef4444]/10 py-2 text-[10px] font-semibold text-[#ef4444] transition-all hover:bg-[#ef4444]/20 active:scale-[0.98]"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              {/* Connection form */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                    MetaApi Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your token"
                    className="w-full rounded border border-[#222] bg-[#1a1a1a] px-2.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    disabled={state === 'connecting'}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="MT4/MT5 account ID"
                    className="w-full rounded border border-[#222] bg-[#1a1a1a] px-2.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    disabled={state === 'connecting'}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-2.5 py-2">
                  <p className="text-[10px] text-[#ef4444]">{error}</p>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={state === 'connecting' || !token.trim() || !accountId.trim()}
                className="w-full rounded border border-[#3b82f6]/30 bg-[#3b82f6]/10 py-2 text-[10px] font-semibold text-[#3b82f6] transition-all hover:bg-[#3b82f6]/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === 'connecting' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full border border-[#3b82f6] border-t-transparent animate-spin" />
                    Connecting…
                  </span>
                ) : (
                  'Connect Broker'
                )}
              </button>

              <p className="text-[9px] text-gray-700 text-center">
                Requires{' '}
                <a
                  href="https://metaapi.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 underline hover:text-gray-400"
                >
                  MetaApi
                </a>{' '}
                account with deployed MT4/MT5
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Compact Account Info ─────────────────────────────────────────────────── */

function AccountInfoCompact({ account }: { account: BrokerAccount }) {
  const marginLevel = account.marginLevel
  const marginColor =
    marginLevel > 200 ? '#22c55e' : marginLevel > 100 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded border border-[#222] bg-[#1a1a1a] p-2.5">
      <span className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
        Account Summary
      </span>
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
        <InfoRow label="Balance" value={`$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#e5e7eb" />
        <InfoRow label="Equity" value={`$${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#e5e7eb" />
        <InfoRow label="Margin" value={`$${account.margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#f59e0b" />
        <InfoRow label="Free Margin" value={`$${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#14b8a6" />
        <InfoRow label="Margin Level" value={`${marginLevel.toFixed(1)}%`} color={marginColor} />
        <InfoRow label="Leverage" value={`1:${account.leverage}`} color="#3b82f6" />
      </div>
    </div>
  )
}

function InfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-gray-600">{label}</span>
      <span className="font-mono text-[10px] font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
