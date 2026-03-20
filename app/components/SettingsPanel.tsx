'use client'

import { useState } from 'react'

export interface ScannerSettings {
  leverage: number
  capital: number
  tp1Ratio: number
  tp2Ratio: number
  tp3Ratio: number
}

interface SettingsPanelProps {
  settings: ScannerSettings
  onSettingsChange: (settings: ScannerSettings) => void
}

const LEVERAGE_OPTIONS = [
  { value: 1, label: '1:1' },
  { value: 10, label: '1:10' },
  { value: 50, label: '1:50' },
  { value: 100, label: '1:100' },
  { value: 200, label: '1:200' },
  { value: 500, label: '1:500' },
  { value: 1000, label: '1:1000' },
]

const CAPITAL_PRESETS = [100, 250, 500, 1000, 2500, 5000, 10000]

const FIBONACCI_RATIOS = [
  { value: 1.272, label: '1.272' },
  { value: 1.414, label: '1.414' },
  { value: 1.618, label: '1.618' },
  { value: 2.0, label: '2.000' },
  { value: 2.618, label: '2.618' },
]

export const DEFAULT_SETTINGS: ScannerSettings = {
  leverage: 1000,
  capital: 500,
  tp1Ratio: 1.618,
  tp2Ratio: 2.618,
  tp3Ratio: 4.236,
}

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [customCapital, setCustomCapital] = useState('')
  const [isCustomCapital, setIsCustomCapital] = useState(false)

  const handleLeverageChange = (leverage: number) => {
    onSettingsChange({ ...settings, leverage })
  }

  const handleCapitalChange = (capital: number) => {
    onSettingsChange({ ...settings, capital })
    setIsCustomCapital(false)
  }

  const handleCustomCapitalSubmit = () => {
    const val = parseFloat(customCapital)
    if (!isNaN(val) && val > 0) {
      onSettingsChange({ ...settings, capital: val })
      setIsCustomCapital(false)
    }
  }

  const handleTp1Change = (tp1Ratio: number) => {
    const tp2Ratio = parseFloat((tp1Ratio * 1.618).toFixed(3))
    const tp3Ratio = parseFloat((tp1Ratio * 2.618).toFixed(3))
    onSettingsChange({ ...settings, tp1Ratio, tp2Ratio, tp3Ratio })
  }

  const handleReset = () => {
    onSettingsChange({ ...DEFAULT_SETTINGS })
    setIsCustomCapital(false)
    setCustomCapital('')
  }

  const isDefault =
    settings.leverage === DEFAULT_SETTINGS.leverage &&
    settings.capital === DEFAULT_SETTINGS.capital &&
    settings.tp1Ratio === DEFAULT_SETTINGS.tp1Ratio

  const marginUsed = settings.capital / settings.leverage
  const effectiveExposure = settings.capital

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#111]"
      style={{ borderTopColor: '#374151', borderTopWidth: '2px' }}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={isExpanded}
        aria-controls="settings-panel-content"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Settings</h3>
          <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
            Config
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isDefault && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]"
              title="Modified from defaults"
              aria-label="Settings modified"
            />
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div
          id="settings-panel-content"
          className="space-y-5 border-t border-white/[0.06] px-4 sm:px-5 pb-5 pt-4"
        >
          {/* Leverage */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Leverage</span>
              <span className="font-mono text-xs font-bold text-white">
                1:{settings.leverage.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LEVERAGE_OPTIONS.map((opt) => {
                const isActive = settings.leverage === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleLeverageChange(opt.value)}
                    className="rounded border px-2.5 py-2 text-[10px] font-semibold transition-all duration-150 active:scale-95"
                    style={{
                      borderColor: isActive ? 'rgba(59,130,246,0.5)' : '#222',
                      backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : '#1a1a1a',
                      color: isActive ? '#93c5fd' : '#6b7280',
                      boxShadow: isActive ? '0 0 8px rgba(59,130,246,0.15)' : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {settings.leverage >= 500 && (
              <div className="mt-1.5 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-[#f59e0b]" aria-hidden="true" />
                <span className="text-[9px] text-[#f59e0b]">
                  High leverage — increased risk
                </span>
              </div>
            )}
          </div>

          {/* Capital */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Capital</span>
              <span className="font-mono text-xs font-bold text-white">
                ${settings.capital.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CAPITAL_PRESETS.map((val) => {
                const isActive = settings.capital === val && !isCustomCapital
                return (
                  <button
                    key={val}
                    onClick={() => handleCapitalChange(val)}
                    className="rounded border px-2.5 py-2 text-[10px] font-semibold transition-all duration-150 active:scale-95"
                    style={{
                      borderColor: isActive ? 'rgba(20,184,166,0.5)' : '#222',
                      backgroundColor: isActive ? 'rgba(20,184,166,0.1)' : '#1a1a1a',
                      color: isActive ? '#5eead4' : '#6b7280',
                      boxShadow: isActive ? '0 0 8px rgba(20,184,166,0.15)' : 'none',
                    }}
                  >
                    ${val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                )
              })}
              <button
                onClick={() => setIsCustomCapital(true)}
                className="rounded border px-2.5 py-2 text-[10px] font-semibold transition-all duration-150 active:scale-95"
                style={{
                  borderColor: isCustomCapital ? 'rgba(20,184,166,0.5)' : '#222',
                  backgroundColor: isCustomCapital ? 'rgba(20,184,166,0.1)' : '#1a1a1a',
                  color: isCustomCapital ? '#5eead4' : '#6b7280',
                }}
              >
                Custom
              </button>
            </div>
            {isCustomCapital && (
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500" aria-hidden="true">
                    $
                  </span>
                  <input
                    type="number"
                    value={customCapital}
                    onChange={(e) => setCustomCapital(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomCapitalSubmit()}
                    placeholder="Enter amount"
                    className="w-full rounded border border-white/[0.06] bg-white/[0.03] py-2.5 pl-6 pr-3 font-mono text-xs text-white placeholder-gray-600 outline-none focus:border-[#10b981]/50 transition-colors"
                    min="1"
                    autoFocus
                    aria-label="Custom capital amount"
                  />
                </div>
                <button
                  onClick={handleCustomCapitalSubmit}
                  className="rounded border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-2.5 text-[10px] font-semibold text-[#5eead4] transition-colors hover:bg-[#10b981]/20 active:scale-95"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* TP1 Fibonacci Ratio */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                TP1 Fibonacci Extension
              </span>
              <span className="font-mono text-xs font-bold text-[#10b981]">
                {settings.tp1Ratio.toFixed(3)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FIBONACCI_RATIOS.map((fib) => {
                const isActive = settings.tp1Ratio === fib.value
                return (
                  <button
                    key={fib.value}
                    onClick={() => handleTp1Change(fib.value)}
                    className="rounded border px-2.5 py-2 text-[10px] font-semibold transition-all duration-150 active:scale-95"
                    style={{
                      borderColor: isActive ? 'rgba(139,92,246,0.5)' : '#222',
                      backgroundColor: isActive ? 'rgba(139,92,246,0.1)' : '#1a1a1a',
                      color: isActive ? '#c4b5fd' : '#6b7280',
                      boxShadow: isActive ? '0 0 8px rgba(139,92,246,0.15)' : 'none',
                    }}
                  >
                    {fib.label}
                  </button>
                )
              })}
            </div>
            {/* TP chain display */}
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#10b981]" aria-hidden="true" />
                <span className="text-[9px] text-zinc-500">TP1</span>
                <span className="font-mono text-[10px] font-semibold text-[#10b981]">
                  {settings.tp1Ratio.toFixed(3)}
                </span>
              </div>
              <span className="text-[8px] text-zinc-600" aria-hidden="true">→</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#10b981]" aria-hidden="true" />
                <span className="text-[9px] text-zinc-500">TP2</span>
                <span className="font-mono text-[10px] font-semibold text-[#10b981]">
                  {settings.tp2Ratio.toFixed(3)}
                </span>
              </div>
              <span className="text-[8px] text-zinc-600" aria-hidden="true">→</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#818cf8]" aria-hidden="true" />
                <span className="text-[9px] text-zinc-500">TP3</span>
                <span className="font-mono text-[10px] font-semibold text-[#818cf8]">
                  {settings.tp3Ratio.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Position Info Summary */}
          <div className="rounded border border-white/[0.06] bg-white/[0.03] p-3">
            <span className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-600">
              Position Summary
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-zinc-500">Margin Used</span>
                <span className="font-mono text-[10px] font-semibold text-zinc-300">
                  ${marginUsed.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-zinc-500">Exposure</span>
                <span className="font-mono text-[10px] font-semibold text-zinc-300">
                  ${effectiveExposure.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-zinc-500">Leverage</span>
                <span className="font-mono text-[10px] font-semibold text-white">
                  1:{settings.leverage.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-zinc-500">TP Method</span>
                <span className="font-mono text-[10px] font-semibold text-[#10b981]">
                  Fibonacci
                </span>
              </div>
            </div>
          </div>

          {/* Reset button */}
          {!isDefault && (
            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.03] py-2.5 text-[10px] font-semibold text-zinc-500 transition-all hover:border-gray-500 hover:text-zinc-300 active:scale-[0.99]"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Reset to Defaults
            </button>
          )}
        </div>
      )}
    </div>
  )
}
