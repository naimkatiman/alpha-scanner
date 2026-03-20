'use client'

import { useState } from 'react'

export type RiskProfile = 'conservative' | 'balanced' | 'high-risk'

type RiskInfo = {
  id: RiskProfile
  label: string
  description: string
  riskPct: string
  maxDrawdown: string
  color: string
}

const PROFILES: RiskInfo[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: 'Low exposure, tight stops, capital preservation focus',
    riskPct: '1%',
    maxDrawdown: '5%',
    color: '#14b8a6',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Moderate risk with structured position sizing',
    riskPct: '2%',
    maxDrawdown: '10%',
    color: '#10b981',
  },
  {
    id: 'high-risk',
    label: 'High Risk',
    description: 'Aggressive entries, wider stops, max opportunity capture',
    riskPct: '5%',
    maxDrawdown: '25%',
    color: '#f43f5e',
  },
]

type Props = {
  selected: RiskProfile
  onSelect: (profile: RiskProfile) => void
}

export default function RiskSelector({ selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(true)

  const selectedProfile = PROFILES.find((p) => p.id === selected)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-3 transition-colors hover:bg-[#111] active:bg-[#111]"
        aria-expanded={expanded}
        aria-controls="risk-selector-content"
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Risk Profile</p>
            <p className="text-[10px] text-zinc-600">Exposure Level</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedProfile && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200"
              style={{
                color: selectedProfile.color,
                backgroundColor: `${selectedProfile.color}15`,
              }}
            >
              {selectedProfile.riskPct}
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
          id="risk-selector-content"
          className="border-t border-white/[0.06] px-3 pb-3 pt-2"
        >
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Risk profile">
            {PROFILES.map((profile) => {
              const isActive = profile.id === selected
              return (
                <button
                  key={profile.id}
                  onClick={() => onSelect(profile.id)}
                  role="radio"
                  aria-checked={isActive}
                  className={[
                    'group rounded-md border px-3 py-3 text-left transition-all duration-200 active:scale-[0.98]',
                    isActive
                      ? ''
                      : 'border-white/[0.06] bg-[#111] hover:border-[#333] hover:bg-white/[0.03]',
                  ].join(' ')}
                  style={
                    isActive
                      ? {
                          borderColor: `${profile.color}66`,
                          backgroundColor: `${profile.color}10`,
                          boxShadow: `0 0 12px ${profile.color}15`,
                        }
                      : undefined
                  }
                >
                  {/* Top row: label + risk % */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0 transition-all duration-200"
                        style={{
                          backgroundColor: profile.color,
                          boxShadow: isActive ? `0 0 6px ${profile.color}` : 'none',
                        }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-xs font-bold transition-colors duration-200"
                        style={{ color: isActive ? profile.color : '#d1d5db' }}
                      >
                        {profile.label}
                      </span>
                    </div>
                    <span
                      className="font-mono text-xs font-bold flex-shrink-0"
                      style={{ color: profile.color }}
                    >
                      {profile.riskPct}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-1 text-[10px] leading-snug text-zinc-600">
                    {profile.description}
                  </p>

                  {/* Stats row */}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-600">Risk/Trade:</span>
                      <span className="font-mono text-[9px] font-semibold text-zinc-400">
                        {profile.riskPct}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-600">Max DD:</span>
                      <span className="font-mono text-[9px] font-semibold text-zinc-400">
                        {profile.maxDrawdown}
                      </span>
                    </div>
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
