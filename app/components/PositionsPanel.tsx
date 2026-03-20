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
      className="rounded-xl border border-white/[0.06] bg-[#111] overflow-hidden"
      style={{ borderTopColor: '#10b981', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Open Positions</h3>
          <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
            {positions.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">Total P&L</span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: totalProfit >= 0 ? '#10b981' : '#f43f5e' }}
          >
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="border-t border-white/[0.06] px-4 py-6 text-center">
          <div className="mb-2 opacity-30"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
          <p className="text-xs text-zinc-500">No open positions</p>
          <p className="mt-0.5 text-[9px] text-zinc-700">Your live trades will appear here</p>
        </div>
      ) : (
        <div className="border-t border-white/[0.06]">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-7 gap-2 px-4 py-2 text-[9px] uppercase tracking-widest text-zinc-600 border-b border-white/[0.06] bg-white/[0.02]">
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
  const typeColor = isBuy ? '#10b981' : '#f43f5e'
  const plColor = position.profit >= 0 ? '#10b981' : '#f43f5e'

  return (
    <>
      {/* Desktop row */}
      <div className="hidden sm:grid grid-cols-7 gap-2 items-center px-4 py-2.5 border-b border-white/[0.06] last:border-b-0 transition-colors hover:bg-white/[0.03]">
        <span className="text-xs font-semibold text-white">{position.symbol}</span>
        <span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
          >
            {position.type}
          </span>
        </span>
        <span className="text-right font-mono text-[10px] text-zinc-400">
          {position.volume.toFixed(2)}
        </span>
        <span className="text-right font-mono text-[10px] text-zinc-400">
          {position.openPrice.toFixed(5)}
        </span>
        <span className="text-right font-mono text-[10px] text-zinc-300">
          {position.currentPrice.toFixed(5)}
        </span>
        <span className="text-right font-mono text-[10px] text-zinc-600">
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
      <div className="sm:hidden border-b border-white/[0.06] last:border-b-0 px-4 py-3 space-y-2">
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
      <span className="block text-[8px] uppercase tracking-widest text-zinc-600">{label}</span>
      <span className="font-mono text-[10px] text-zinc-400">{value}</span>
    </div>
  )
}
