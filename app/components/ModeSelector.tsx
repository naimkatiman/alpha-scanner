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
    color: '#3b82f6',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'scalper',
    label: 'Scalper',
    description: 'Quick entries targeting small pip movements',
    timeframe: 'M1 – M5',
    color: '#a855f7',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Trading Mode</p>
            <p className="text-[10px] text-gray-600">Strategy Type</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedMode && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
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
            className={`text-gray-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-[--color-border] px-3 pb-3 pt-2">
          <div className="flex flex-col gap-1.5">
            {MODES.map((mode) => {
              const isActive = mode.id === selected
              return (
                <button
                  key={mode.id}
                  onClick={() => onSelect(mode.id)}
                  className={[
                    'group flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-all duration-150',
                    isActive
                      ? 'border-opacity-40 bg-opacity-10'
                      : 'border-[--color-border] bg-[--color-card] hover:border-[--color-border-subtle] hover:bg-[--color-card-alt]',
                  ].join(' ')}
                  style={
                    isActive
                      ? {
                          borderColor: `${mode.color}66`,
                          backgroundColor: `${mode.color}10`,
                        }
                      : undefined
                  }
                >
                  {/* Icon */}
                  <span
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: isActive ? mode.color : '#6b7280' }}
                  >
                    {mode.icon}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          'text-xs font-bold',
                          isActive ? '' : 'text-gray-300',
                        ].join(' ')}
                        style={isActive ? { color: mode.color } : undefined}
                      >
                        {mode.label}
                      </span>
                      <span className="font-mono text-[9px] text-gray-600">
                        {mode.timeframe}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-gray-600">
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
