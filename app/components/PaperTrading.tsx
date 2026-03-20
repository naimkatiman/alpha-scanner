'use client'

import { useState } from 'react'
import type { PaperTrade, PaperStats, PaperAccount } from '../hooks/usePaperTrading'
import { fmt } from '../data/mockSignals'

interface PaperTradingProps {
  enabled: boolean
  autoTrade: boolean
  account: PaperAccount
  equity: number
  unrealizedPL: number
  stats: PaperStats
  lotSize: number
  selectedSymbol: string
  currentPrice: number
  onSetLotSize: (size: number) => void
  onToggleEnabled: () => void
  onToggleAutoTrade: () => void
  onOpenTrade: (symbol: string, direction: 'buy' | 'sell', price: number) => void
  onCloseTrade: (tradeId: string, price: number) => void
  onCloseAll: (prices: Record<string, number>) => void
  onReset: () => void
  prices: Record<string, { price: number }> | null
}

const LOT_PRESETS = [0.01, 0.05, 0.1, 0.5, 1.0]

export default function PaperTrading({
  enabled,
  autoTrade,
  account,
  equity,
  unrealizedPL,
  stats,
  lotSize,
  selectedSymbol,
  currentPrice,
  onSetLotSize,
  onToggleEnabled,
  onToggleAutoTrade,
  onOpenTrade,
  onCloseTrade,
  onCloseAll,
  onReset,
  prices,
}: PaperTradingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  return (
    <div
      className="rounded-lg border border-[#222] bg-[#111] overflow-hidden"
      style={{ borderTopColor: '#14b8a6', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left"
        >
          <h3 className="text-sm font-semibold text-white">Paper Trading</h3>
          <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
            Simulation
          </span>
        </button>

        <div className="flex items-center gap-3">
          {/* Enable toggle */}
          <button
            onClick={onToggleEnabled}
            className="relative h-5 w-9 rounded-full transition-colors duration-200"
            style={{ backgroundColor: enabled ? '#14b8a6' : '#333' }}
            aria-label={enabled ? 'Disable paper trading' : 'Enable paper trading'}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: enabled ? 'translateX(16px)' : 'translateX(2px)' }}
            />
          </button>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-gray-500 transition-transform duration-200 cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isExpanded && enabled && (
        <div className="border-t border-[#222] px-4 py-4 sm:px-5 space-y-4">
          {/* Account Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <AccountStat
              label="Balance"
              value={`$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="#e5e7eb"
            />
            <AccountStat
              label="Equity"
              value={`$${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="#e5e7eb"
            />
            <AccountStat
              label="Unrealized P&L"
              value={`${unrealizedPL >= 0 ? '+' : ''}$${unrealizedPL.toFixed(2)}`}
              color={unrealizedPL >= 0 ? '#22c55e' : '#ef4444'}
            />
            <AccountStat
              label="Open Trades"
              value={String(account.openTrades.length)}
              color="#3b82f6"
            />
          </div>

          {/* Quick trade */}
          <div className="rounded border border-[#222] bg-[#1a1a1a] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-gray-600">Quick Trade</span>
              <span className="font-mono text-xs text-white">
                {selectedSymbol} — {fmt(selectedSymbol, currentPrice)}
              </span>
            </div>

            {/* Lot size */}
            <div>
              <span className="block text-[9px] text-gray-600 mb-1.5">Lot Size</span>
              <div className="flex flex-wrap gap-1.5">
                {LOT_PRESETS.map((lot) => {
                  const isActive = lotSize === lot
                  return (
                    <button
                      key={lot}
                      onClick={() => onSetLotSize(lot)}
                      className="rounded border px-2 py-1.5 text-[10px] font-semibold transition-all duration-150 active:scale-95"
                      style={{
                        borderColor: isActive ? 'rgba(20,184,166,0.5)' : '#222',
                        backgroundColor: isActive ? 'rgba(20,184,166,0.1)' : '#0d0d0d',
                        color: isActive ? '#5eead4' : '#6b7280',
                      }}
                    >
                      {lot}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* BUY / SELL buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenTrade(selectedSymbol, 'buy', currentPrice)}
                disabled={!currentPrice}
                className="rounded border border-[#3b82f6]/40 bg-[#3b82f6]/15 py-2.5 text-xs font-bold text-[#3b82f6] transition-all hover:bg-[#3b82f6]/25 active:scale-[0.97] disabled:opacity-30"
              >
                📈 Paper BUY
              </button>
              <button
                onClick={() => onOpenTrade(selectedSymbol, 'sell', currentPrice)}
                disabled={!currentPrice}
                className="rounded border border-[#ef4444]/40 bg-[#ef4444]/15 py-2.5 text-xs font-bold text-[#ef4444] transition-all hover:bg-[#ef4444]/25 active:scale-[0.97] disabled:opacity-30"
              >
                📉 Paper SELL
              </button>
            </div>

            {/* Auto-trade toggle */}
            <div className="flex items-center justify-between rounded border border-[#222] bg-[#0d0d0d] px-3 py-2">
              <div>
                <span className="text-[10px] text-gray-400">Auto-Trade on Signal</span>
                <p className="text-[8px] text-gray-700">Opens trades when scanner signals fire</p>
              </div>
              <button
                onClick={onToggleAutoTrade}
                className="relative h-4 w-7 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ backgroundColor: autoTrade ? '#14b8a6' : '#333' }}
              >
                <span
                  className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: autoTrade ? 'translateX(12px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>

          {/* Open positions */}
          {account.openTrades.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-600">
                  Open Positions
                </span>
                <button
                  onClick={() => {
                    const priceMap: Record<string, number> = {}
                    for (const t of account.openTrades) {
                      priceMap[t.symbol] = prices?.[t.symbol]?.price ?? t.openPrice
                    }
                    onCloseAll(priceMap)
                  }}
                  className="text-[9px] text-[#ef4444] hover:text-[#f87171] transition-colors"
                >
                  Close All
                </button>
              </div>
              {account.openTrades.map((trade) => {
                const curPrice = prices?.[trade.symbol]?.price ?? trade.openPrice
                const pl = trade.direction === 'buy'
                  ? (curPrice - trade.openPrice) * trade.volume * 100
                  : (trade.openPrice - curPrice) * trade.volume * 100
                const typeColor = trade.direction === 'buy' ? '#3b82f6' : '#ef4444'
                const plColor = pl >= 0 ? '#22c55e' : '#ef4444'

                return (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between rounded border border-[#222] bg-[#1a1a1a] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-white">{trade.symbol}</span>
                      <span
                        className="rounded px-1 py-0.5 text-[8px] font-bold uppercase"
                        style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
                      >
                        {trade.direction}
                      </span>
                      <span className="font-mono text-[9px] text-gray-600">{trade.volume}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: plColor }}
                      >
                        {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onCloseTrade(trade.id, curPrice)}
                        className="rounded bg-[#222] px-1.5 py-0.5 text-[8px] text-gray-500 hover:text-white hover:bg-[#333] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats */}
          {stats.totalTrades > 0 && (
            <div className="rounded border border-[#222] bg-[#1a1a1a] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-600">
                  Performance
                </span>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatCell label="Win Rate" value={`${stats.winRate.toFixed(0)}%`} color={stats.winRate >= 50 ? '#22c55e' : '#ef4444'} />
                <StatCell label="Total P&L" value={`$${stats.totalProfit.toFixed(2)}`} color={stats.totalProfit >= 0 ? '#22c55e' : '#ef4444'} />
                <StatCell label="Trades" value={String(stats.totalTrades)} color="#3b82f6" />
              </div>
            </div>
          )}

          {/* Trade history */}
          {showHistory && account.tradeHistory.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {account.tradeHistory.slice(0, 20).map((trade) => (
                <HistoryRow key={trade.id} trade={trade} />
              ))}
            </div>
          )}

          {/* Reset */}
          <div className="flex items-center justify-between">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-[9px] text-gray-700 hover:text-gray-500 transition-colors"
              >
                Reset Account
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500">Reset to $10,000?</span>
                <button
                  onClick={() => { onReset(); setShowResetConfirm(false) }}
                  className="text-[9px] text-[#ef4444] font-semibold hover:text-[#f87171]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[9px] text-gray-600 hover:text-gray-400"
                >
                  No
                </button>
              </div>
            )}
            <span className="text-[8px] text-gray-700">
              Initial: ${account.initialBalance.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {isExpanded && !enabled && (
        <div className="border-t border-[#222] px-4 py-6 text-center">
          <div className="mb-2 text-2xl opacity-30">📝</div>
          <p className="text-xs text-gray-500">Paper trading is disabled</p>
          <p className="mt-0.5 text-[9px] text-gray-700">
            Enable to simulate trades with $10,000 virtual balance
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function AccountStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded border border-[#222] bg-[#1a1a1a] px-2.5 py-2 text-center">
      <span className="block text-[8px] uppercase tracking-widest text-gray-600 mb-0.5">{label}</span>
      <span className="font-mono text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <span className="block text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
      <span className="font-mono text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function HistoryRow({ trade }: { trade: PaperTrade }) {
  const typeColor = trade.direction === 'buy' ? '#3b82f6' : '#ef4444'
  const pl = trade.profit ?? 0
  const plColor = pl >= 0 ? '#22c55e' : '#ef4444'
  const time = new Date(trade.closeTime ?? trade.openTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between rounded border border-[#222] bg-[#1a1a1a] px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] font-semibold text-white">{trade.symbol}</span>
        <span
          className="rounded px-1 py-0.5 text-[7px] font-bold uppercase"
          style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
        >
          {trade.direction}
        </span>
        <span className="text-[8px] text-gray-700">{time}</span>
      </div>
      <span className="font-mono text-[9px] font-bold flex-shrink-0" style={{ color: plColor }}>
        {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
      </span>
    </div>
  )
}
