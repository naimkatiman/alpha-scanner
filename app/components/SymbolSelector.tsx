'use client'

import { useState } from 'react'

export type SymbolInfo = {
  symbol: string
  name: string
  category: 'Commodity' | 'Crypto'
  icon: string
  mockPrice: string
  mockChange: string
  changePositive: boolean
}

export const SYMBOLS: SymbolInfo[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold',
    category: 'Commodity',
    icon: '🥇',
    mockPrice: '2,164.50',
    mockChange: '+0.34%',
    changePositive: true,
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver',
    category: 'Commodity',
    icon: '🥈',
    mockPrice: '24.89',
    mockChange: '-0.12%',
    changePositive: false,
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    category: 'Crypto',
    icon: '₿',
    mockPrice: '87,432.00',
    mockChange: '+1.24%',
    changePositive: true,
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum',
    category: 'Crypto',
    icon: 'Ξ',
    mockPrice: '3,245.80',
    mockChange: '+0.87%',
    changePositive: true,
  },
  {
    symbol: 'XRPUSD',
    name: 'Ripple',
    category: 'Crypto',
    icon: '✕',
    mockPrice: '0.6234',
    mockChange: '-0.45%',
    changePositive: false,
  },
]

type Props = {
  selected: string
  onSelect: (symbol: string) => void
}

export default function SymbolSelector({ selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(true)

  const categories = ['Commodity', 'Crypto'] as const
  const selectedInfo = SYMBOLS.find((s) => s.symbol === selected)

  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-card-alt] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2.5 transition-colors hover:bg-[--color-card]"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Symbol</p>
            <p className="text-[10px] text-gray-600">Asset Selector</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedInfo && (
            <span className="rounded bg-[--color-card] px-1.5 py-0.5 font-mono text-[10px] text-[--color-buy]">
              {selectedInfo.symbol}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-gray-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-[--color-border] px-3 pb-3 pt-2">
          {categories.map((cat) => {
            const syms = SYMBOLS.filter((s) => s.category === cat)
            return (
              <div key={cat} className="mb-2 last:mb-0">
                {/* Category label */}
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{
                      backgroundColor: cat === 'Commodity' ? '#f59e0b' : '#8b5cf6',
                    }}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                    {cat === 'Commodity' ? 'Commodities' : 'Cryptocurrencies'}
                  </span>
                </div>

                {/* Symbol buttons */}
                <div className="flex flex-col gap-1">
                  {syms.map((s) => {
                    const isActive = s.symbol === selected
                    return (
                      <button
                        key={s.symbol}
                        onClick={() => onSelect(s.symbol)}
                        className={[
                          'group flex items-center justify-between rounded-md border px-2.5 py-2 transition-all duration-150',
                          isActive
                            ? 'border-[--color-buy]/40 bg-[--color-buy]/10'
                            : 'border-[--color-border] bg-[--color-card] hover:border-[--color-border-subtle] hover:bg-[--color-card-alt]',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{s.icon}</span>
                          <div className="text-left">
                            <span
                              className={[
                                'font-mono text-[11px] font-bold',
                                isActive ? 'text-[--color-buy]' : 'text-gray-300',
                              ].join(' ')}
                            >
                              {s.symbol}
                            </span>
                            <span className="ml-1.5 text-[9px] text-gray-600">{s.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-500">
                            {s.mockPrice}
                          </span>
                          <span
                            className={[
                              'font-mono text-[9px] font-semibold',
                              s.changePositive ? 'text-[--color-teal]' : 'text-[--color-sell]',
                            ].join(' ')}
                          >
                            {s.mockChange}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
