'use client'

import type { BrokerPosition } from '../lib/brokerApi'
import type { BrokerState } from '../hooks/useBroker'

interface PositionsPanelProps {
  state: BrokerState
  positions: BrokerPosition[]
  totalProfit: number
}

export default function PositionsPanel({ state, positions, totalProfit }: PositionsPanelProps) {
  if (state !== 'connected') return null

  return (
    <div
      className="rounded-lg border border-[#222] bg-[#111] overflow-hidden"
      style={{ borderTopColor: '#8b5cf6', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Open Positions</h3>
          <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
            {positions.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-600">Total P&L</span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: totalProfit >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="border-t border-[#222] px-4 py-6 text-center">
          <div className="mb-2 text-2xl opacity-30">📭</div>
          <p className="text-xs text-gray-500">No open positions</p>
          <p className="mt-0.5 text-[9px] text-gray-700">Your live trades will appear here</p>
        </div>
      ) : (
        <div className="border-t border-[#222]">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-7 gap-2 px-4 py-2 text-[9px] uppercase tracking-widest text-gray-600 border-b border-[#222] bg-[#0d0d0d]">
            <span>Symbol</span>
            <span>Type</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Open</span>
            <span className="text-right">Current</span>
            <span className="text-right">Swap</span>
            <span className="text-right">P&L</span>
          </div>

          {/* Positions */}
          {positions.map((pos) => (
            <PositionRow key={pos.id} position={pos} />
          ))}
        </div>
      )}
    </div>
  )
}

function PositionRow({ position }: { position: BrokerPosition }) {
  const isBuy = position.type === 'buy'
  const typeColor = isBuy ? '#3b82f6' : '#ef4444'
  const plColor = position.profit >= 0 ? '#22c55e' : '#ef4444'

  return (
    <>
      {/* Desktop row */}
      <div className="hidden sm:grid grid-cols-7 gap-2 items-center px-4 py-2.5 border-b border-[#222] last:border-b-0 transition-colors hover:bg-[#1a1a1a]">
        <span className="text-xs font-semibold text-white">{position.symbol}</span>
        <span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
          >
            {position.type}
          </span>
        </span>
        <span className="text-right font-mono text-[10px] text-gray-400">
          {position.volume.toFixed(2)}
        </span>
        <span className="text-right font-mono text-[10px] text-gray-400">
          {position.openPrice.toFixed(5)}
        </span>
        <span className="text-right font-mono text-[10px] text-gray-300">
          {position.currentPrice.toFixed(5)}
        </span>
        <span className="text-right font-mono text-[10px] text-gray-600">
          {position.swap.toFixed(2)}
        </span>
        <span
          className="text-right font-mono text-[10px] font-bold"
          style={{ color: plColor }}
        >
          {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
        </span>
      </div>

      {/* Mobile card */}
      <div className="sm:hidden border-b border-[#222] last:border-b-0 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">{position.symbol}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
            >
              {position.type}
            </span>
          </div>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: plColor }}
          >
            {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MobileDetail label="Volume" value={position.volume.toFixed(2)} />
          <MobileDetail label="Open" value={position.openPrice.toFixed(5)} />
          <MobileDetail label="Current" value={position.currentPrice.toFixed(5)} />
        </div>
      </div>
    </>
  )
}

function MobileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[8px] uppercase tracking-widest text-gray-600">{label}</span>
      <span className="font-mono text-[10px] text-gray-400">{value}</span>
    </div>
  )
}
