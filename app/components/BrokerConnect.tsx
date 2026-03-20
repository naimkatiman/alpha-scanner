'use client'

import { useState } from 'react'
import { Link2, Loader2, Unplug, ChevronDown } from 'lucide-react'
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
  disconnected: { dot: 'bg-zinc-500', label: 'Disconnected', color: '#71717a' },
  connecting: { dot: 'bg-yellow-400 animate-pulse', label: 'Connecting...', color: '#facc15' },
  connected: { dot: 'bg-emerald-500', label: 'Connected', color: '#10b981' },
  error: { dot: 'bg-rose-500', label: 'Error', color: '#f43f5e' },
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
    <div className="rounded-xl border border-white/[0.06] bg-[#111] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link2 size={14} className="text-zinc-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-white truncate">Broker</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          <span className="text-[9px] uppercase tracking-wider" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          <ChevronDown
            size={10}
            className={`text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06] px-3 py-3 space-y-3">
          {state === 'connected' && account ? (
            <>
              <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Account</span>
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase">
                    {account.platform}
                  </span>
                </div>
                <div className="text-xs text-white font-medium truncate">{account.name}</div>
                <div className="text-[9px] text-zinc-600 truncate">{account.server}</div>
              </div>

              <AccountInfoCompact account={account} />

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-1.5 rounded border border-rose-500/30 bg-rose-500/10 py-2 text-[10px] font-semibold text-rose-500 transition-all hover:bg-rose-500/20 active:scale-[0.98]"
              >
                <Unplug size={12} />
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    MetaApi Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your token"
                    className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
                    disabled={state === 'connecting'}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="MT4/MT5 account ID"
                    className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
                    disabled={state === 'connecting'}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-2">
                  <p className="text-[10px] text-rose-500">{error}</p>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={state === 'connecting' || !token.trim() || !accountId.trim()}
                className="w-full rounded border border-emerald-500/30 bg-emerald-500/10 py-2 text-[10px] font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === 'connecting' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  'Connect Broker'
                )}
              </button>

              <p className="text-[9px] text-zinc-700 text-center">
                Requires{' '}
                <a
                  href="https://metaapi.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 underline hover:text-zinc-400"
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

function AccountInfoCompact({ account }: { account: BrokerAccount }) {
  const marginLevel = account.marginLevel
  const marginColor =
    marginLevel > 200 ? '#10b981' : marginLevel > 100 ? '#facc15' : '#f43f5e'

  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2.5">
      <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
        Account Summary
      </span>
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
        <InfoRow label="Balance" value={`$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#e4e4e7" />
        <InfoRow label="Equity" value={`$${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#e4e4e7" />
        <InfoRow label="Margin" value={`$${account.margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#facc15" />
        <InfoRow label="Free Margin" value={`$${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#10b981" />
        <InfoRow label="Margin Level" value={`${marginLevel.toFixed(1)}%`} color={marginColor} />
        <InfoRow label="Leverage" value={`1:${account.leverage}`} color="#10b981" />
      </div>
    </div>
  )
}

function InfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-zinc-600">{label}</span>
      <span className="font-mono text-[10px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
