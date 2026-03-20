'use client'

import { useState } from 'react'

export type TradingMode = 'swing' | 'intraday' | 'scalper'

type ModeInfo = {
  id: TradingMode
  label: string
  description: string
  timeframe: string
  color: string
  icon: React.ReactNode
}

const MODES: ModeInfo[] = [
  {
    id: 'swing',
    label: 'Swing',
    description: 'Multi-day positions following larger trends',
    timeframe: 'H4 – D1',
    color: '#10b981',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    ),
  },
  {
    id: 'intraday',
    label: 'Intraday',
    description: 'Within-session trades, closed before day end',
    timeframe: 'M15 – H1',
    color: '#14b8a6',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'scalper',
    label: 'Scalper',
    description: 'Quick entries targeting small pip movements',
    timeframe: 'M1 – M5',
    color: '#a1a1aa',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
]

type Props = {
  selected: TradingMode
  onSelect: (mode: TradingMode) => void
}

export default function ModeSelector({ selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(true)

  const selectedMode = MODES.find((m) => m.id === selected)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-3 transition-colors hover:bg-[#111] active:bg-[#111]"
        aria-expanded={expanded}
        aria-controls="mode-selector-content"
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
            className="text-zinc-500 flex-shrink-0"
            aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Trading Mode</p>
            <p className="text-[10px] text-zinc-600">Strategy Type</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedMode && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200"
              style={{ color: selectedMode.color, backgroundColor: `${selectedMode.color}15` }}
            >
              {selectedMode.label}
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
            className={`text-zinc-600 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div
          id="mode-selector-content"
          className="border-t border-white/[0.06] px-3 pb-3 pt-2"
        >
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Trading mode">
            {MODES.map((mode) => {
              const isActive = mode.id === selected
              return (
                <button
                  key={mode.id}
                  onClick={() => onSelect(mode.id)}
                  role="radio"
                  aria-checked={isActive}
                  className={[
                    'group flex items-start gap-2.5 rounded-md border px-3 py-3 text-left transition-all duration-200 active:scale-[0.98]',
                    isActive
                      ? ''
                      : 'border-white/[0.06] bg-[#111] hover:border-[#333] hover:bg-white/[0.03]',
                  ].join(' ')}
                  style={
                    isActive
                      ? {
                          borderColor: `${mode.color}66`,
                          backgroundColor: `${mode.color}10`,
                          boxShadow: `0 0 12px ${mode.color}15`,
                        }
                      : undefined
                  }
                >
                  {/* Icon */}
                  <span
                    className="mt-0.5 flex-shrink-0 transition-colors duration-200"
                    style={{ color: isActive ? mode.color : '#6b7280' }}
                  >
                    {mode.icon}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-bold transition-colors duration-200"
                        style={{ color: isActive ? mode.color : '#d1d5db' }}
                      >
                        {mode.label}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-600 flex-shrink-0">
                        {mode.timeframe}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
                      {mode.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
