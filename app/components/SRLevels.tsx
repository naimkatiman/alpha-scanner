'use client'

import { useState } from 'react'
import { useSR } from '../hooks/useSR'
import { fmt } from '../data/mockSignals'

interface SRLevelsProps {
  symbol: string
}

export default function SRLevels({ symbol }: SRLevelsProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { support, resistance, currentPrice, loading, error } = useSR(symbol)
  const hasData = support.length > 0 || resistance.length > 0

  return (
    <div
      className="rounded-lg border border-[#222] bg-[#111]"
      style={{ borderTopColor: '#f59e0b', borderTopWidth: '2px' }}
    >
      {/* Collapsible header */}
      <button
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-4 hover:bg-[#1a1a1a] transition-colors rounded-t-lg"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Support &amp; Resistance</h3>
          <span className="hidden sm:inline text-xs text-gray-600">
            · {symbol} · 30-day pivot clusters
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-gray-600 flex-shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-[#222] px-4 pb-4 sm:px-5 sm:pb-5">
          {/* Loading shimmer */}
          {loading && (
            <div className="flex flex-col gap-2 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-[#1a1a1a] animate-pulse" />
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="mt-4 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-3 text-xs text-gray-500">
              Unable to load S/R data · {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !hasData && (
            <div className="mt-4 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-3 text-xs text-gray-500">
              No S/R levels detected
            </div>
          )}

          {/* Price ladder */}
          {!loading && !error && hasData && (
            <div className="mt-4 space-y-2">
              {/* Resistance levels — highest at top, R1 nearest to current price */}
              {[...resistance].reverse().map((level, i) => {
                const labelNum = resistance.length - i
                return (
                  <div key={`res-${labelNum}`}>
                    <div
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                      style={{ borderColor: '#ef444430', backgroundColor: '#ef44440a' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: '#ef4444',
                            boxShadow: '0 0 4px #ef444460',
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-semibold text-gray-300 flex-shrink-0">
                          R{labelNum}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-600 hidden sm:inline">
                          Resistance
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
                          style={{ backgroundColor: '#ef444418', color: '#ef4444' }}
                        >
                          {level.touches}× touched
                        </span>
                        <span className="font-mono text-xs font-bold text-[#ef4444]">
                          {fmt(symbol, level.price)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-[#222]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${level.strength * 100}%`,
                          backgroundColor: '#ef4444',
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Current price marker */}
              {currentPrice !== null && currentPrice > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed border-gray-700" aria-hidden="true" />
                  <div className="flex items-center gap-2 rounded-md border border-gray-700 bg-[#1a1a1a] px-2.5 py-1.5 flex-shrink-0">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                      Price
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {fmt(symbol, currentPrice)}
                    </span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-gray-700" aria-hidden="true" />
                </div>
              )}

              {/* Support levels — S1 nearest to current price */}
              {support.map((level, i) => (
                <div key={`sup-${i}`}>
                  <div
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                    style={{ borderColor: '#22c55e30', backgroundColor: '#22c55e0a' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: '#22c55e',
                          boxShadow: '0 0 4px #22c55e60',
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold text-gray-300 flex-shrink-0">
                        S{i + 1}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-gray-600 hidden sm:inline">
                        Support
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
                        style={{ backgroundColor: '#22c55e18', color: '#22c55e' }}
                      >
                        {level.touches}× touched
                      </span>
                      <span className="font-mono text-xs font-bold text-[#22c55e]">
                        {fmt(symbol, level.price)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-[#222]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${level.strength * 100}%`,
                        backgroundColor: '#22c55e',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
