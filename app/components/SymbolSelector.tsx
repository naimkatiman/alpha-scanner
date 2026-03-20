'use client'

import { useState, useEffect, useRef } from 'react'
import { fmt, getSymbolsByCategory, getAllSymbols } from '../lib/symbols'
import type { SymbolPrice } from '../hooks/usePrices'
import { Coins, Bitcoin, DollarSign, Globe, ChevronDown, CircleDot } from 'lucide-react'

function SymbolIcon({ icon, className = '' }: { icon: string; className?: string }) {
  const size = 14
  switch (icon) {
    case 'gold':
    case 'silver':
      return <Coins size={size} className={className} />
    default:
      if (icon.length <= 3) return <DollarSign size={size} className={className} />
      return <CircleDot size={size} className={className} />
  }
}

type Props = {
  selected: string
  onSelect: (symbol: string) => void
  prices?: Record<string, SymbolPrice> | null
  pricesLoading?: boolean
  positionSymbols?: Set<string>
}

const CATEGORIES = [
  { key: 'Metals' as const, label: 'Metals', color: '#f59e0b' },
  { key: 'Crypto' as const, label: 'Cryptocurrencies', color: '#8b5cf6' },
  { key: 'Forex' as const, label: 'Forex Pairs', color: '#10b981' },
]

function formatChange(change: number): { text: string; positive: boolean } {
  const positive = change >= 0
  return { text: `${positive ? '+' : ''}${change.toFixed(2)}%`, positive }
}

export default function SymbolSelector({ selected, onSelect, prices, pricesLoading, positionSymbols }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [catExpanded, setCatExpanded] = useState<Record<string, boolean>>({
    Metals: true,
    Crypto: true,
    Forex: true,
  })
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, boolean>>({})
  const prevPricesRef = useRef<Record<string, SymbolPrice> | null>(null)

  useEffect(() => {
    if (!prices) return
    const newFlashing: Record<string, boolean> = {}
    if (prevPricesRef.current) {
      for (const sym of Object.keys(prices)) {
        if (prevPricesRef.current[sym]?.price !== prices[sym]?.price) {
          newFlashing[sym] = true
        }
      }
    }
    prevPricesRef.current = prices
    if (Object.keys(newFlashing).length > 0) {
      setFlashingSymbols(newFlashing)
      const t = setTimeout(() => setFlashingSymbols({}), 800)
      return () => clearTimeout(t)
    }
  }, [prices])

  const allSymbols = getAllSymbols()
  const selectedInfo = allSymbols.find((s) => s.symbol === selected)

  function toggleCat(key: string) {
    setCatExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-3 transition-colors hover:bg-[#111] active:bg-[#111]"
        aria-expanded={expanded}
        aria-controls="symbol-selector-content"
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
            className="text-gray-500 flex-shrink-0"
            aria-hidden="true"
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
            <span className="rounded bg-[#111] px-1.5 py-0.5 font-mono text-[10px] text-[#10b981]">
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
            className={`text-gray-600 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div
          id="symbol-selector-content"
          className="border-t border-white/[0.06] px-3 pb-3 pt-2"
        >
          {CATEGORIES.map((cat) => {
            const syms = getSymbolsByCategory(cat.key)
            const isCatExpanded = catExpanded[cat.key] ?? true

            return (
              <div key={cat.key} className="mb-2 last:mb-0">
                {/* Category header — collapsible */}
                <button
                  onClick={() => toggleCat(cat.key)}
                  className="mb-1.5 flex w-full items-center gap-1.5 hover:opacity-80 transition-opacity"
                  aria-expanded={isCatExpanded}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden="true"
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-600 flex-1 text-left">
                    {cat.label}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`text-gray-700 transition-transform duration-150 flex-shrink-0 ${isCatExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Symbol buttons */}
                {isCatExpanded && (
                  <div className="flex flex-col gap-1" role="radiogroup" aria-label={cat.label}>
                    {syms.map((s) => {
                      const isActive = s.symbol === selected
                      const livePrice = prices?.[s.symbol]
                      const isFlashing = flashingSymbols[s.symbol] ?? false
                      const hasPosition = positionSymbols?.has(s.symbol) ?? false

                      let displayPrice: string
                      let displayChange: string
                      let changePositive: boolean

                      if (livePrice) {
                        displayPrice = fmt(s.symbol, livePrice.price)
                        const ch = formatChange(livePrice.change24h)
                        displayChange = ch.text
                        changePositive = ch.positive
                      } else {
                        displayPrice = fmt(s.symbol, s.fallbackPrice)
                        displayChange = '—'
                        changePositive = true
                      }

                      return (
                        <button
                          key={s.symbol}
                          onClick={() => onSelect(s.symbol)}
                          role="radio"
                          aria-checked={isActive}
                          className={[
                            'group flex items-center justify-between rounded-md border px-2.5 py-2.5 transition-all duration-150 active:scale-[0.98]',
                            isActive
                              ? 'border-[#10b981]/40 bg-[#10b981]/10'
                              : 'border-white/[0.06] bg-[#111] hover:border-[#333] hover:bg-white/[0.03]',
                            isFlashing ? 'ring-1 ring-[#10b981]/40' : '',
                          ].join(' ')}
                          style={isActive ? { boxShadow: '0 0 10px rgba(59,130,246,0.12)' } : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <SymbolIcon icon={s.icon} className="flex-shrink-0 text-zinc-500" />
                            <div className="text-left min-w-0">
                              <span
                                className={[
                                  'font-mono text-[11px] font-bold',
                                  isActive ? 'text-[#10b981]' : 'text-zinc-300',
                                ].join(' ')}
                              >
                                {s.symbol}
                              </span>
                              <span className="ml-1.5 text-[9px] text-gray-600">{s.name}</span>
                              {hasPosition && (
                                <span
                                  className="ml-1 h-1.5 w-1.5 rounded-full bg-[#8b5cf6] inline-block flex-shrink-0"
                                  title="Open position"
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {pricesLoading && !livePrice ? (
                              <span className="hidden sm:block h-2 w-14 rounded bg-[#222] animate-pulse" />
                            ) : (
                              <span
                                className={[
                                  'hidden sm:inline font-mono text-[10px] transition-colors',
                                  isFlashing ? 'text-[#10b981]' : 'text-gray-500',
                                ].join(' ')}
                              >
                                {displayPrice}
                              </span>
                            )}
                            <span
                              className={[
                                'font-mono text-[9px] font-semibold',
                                changePositive ? 'text-[#10b981]' : 'text-[#f43f5e]',
                              ].join(' ')}
                            >
                              {displayChange}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
