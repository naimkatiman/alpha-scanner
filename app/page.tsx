'use client'

import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SymbolSelector from './components/SymbolSelector'
import ModeSelector, { type TradingMode } from './components/ModeSelector'
import RiskSelector, { type RiskProfile } from './components/RiskSelector'
import SignalPanel from './components/SignalPanel'
import TpSlDisplay from './components/TpSlDisplay'
import SettingsPanel, { DEFAULT_SETTINGS, type ScannerSettings } from './components/SettingsPanel'
import SRLevels from './components/SRLevels'
import IndicatorsPanel from './components/IndicatorsPanel'
import { usePrices } from './hooks/usePrices'
import { useSignals } from './hooks/useSignals'

type ConnectionStatus = 'loading' | 'live' | 'stale' | 'error'

function getConnectionStatus(
  loading: boolean,
  error: string | null,
  lastUpdated: number | null,
): ConnectionStatus {
  if (loading && !lastUpdated) return 'loading'
  if (error && !lastUpdated) return 'error'
  if (!lastUpdated) return 'error'
  if (Date.now() - lastUpdated > 60_000) return 'stale'
  return 'live'
}

const STATUS_DOT: Record<ConnectionStatus, string> = {
  live: 'bg-[#22c55e]',
  stale: 'bg-yellow-400',
  loading: 'bg-gray-500 animate-pulse',
  error: 'bg-[#ef4444]',
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  live: 'LIVE',
  stale: 'STALE',
  loading: 'CONNECTING',
  error: 'OFFLINE',
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD')
  const [selectedMode, setSelectedMode] = useState<TradingMode>('swing')
  const [selectedRisk, setSelectedRisk] = useState<RiskProfile>('balanced')
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS)

  const { prices, loading: pricesLoading, error: pricesError, lastUpdated } = usePrices()
  const { signal } = useSignals(selectedSymbol, selectedMode, selectedRisk)
  const connectionStatus = getConnectionStatus(pricesLoading, pricesError, lastUpdated)

  const currentPrice = prices?.[selectedSymbol]?.price ?? 0
  const direction = signal?.direction ?? 'NEUTRAL'

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] overflow-x-hidden">
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />

      <div className="relative flex flex-1">
        {/* Mobile overlay — dim bg when sidebar open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/70 animate-fade-in md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'fixed top-16 bottom-0 left-0 z-40 w-[280px] flex-shrink-0',
            'overflow-y-auto border-r border-[#222] bg-[#111]',
            'transition-transform duration-300 ease-in-out will-change-transform',
            'md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
            sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          ].join(' ')}
          aria-label="Sidebar controls"
        >
          {/* Sidebar header */}
          <div className="flex h-10 items-center justify-between border-b border-[#222] px-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
              Controls
            </span>
            <button
              onClick={closeSidebar}
              className="btn-icon rounded p-1.5 text-gray-600 hover:bg-[#1a1a1a] hover:text-gray-300 transition-colors md:hidden"
              aria-label="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex flex-col gap-3 p-4 pb-8">
            <SymbolSelector
              selected={selectedSymbol}
              onSelect={(s) => { setSelectedSymbol(s); closeSidebar() }}
              prices={prices}
              pricesLoading={pricesLoading}
            />

            <ModeSelector
              selected={selectedMode}
              onSelect={(m) => { setSelectedMode(m) }}
            />

            <RiskSelector
              selected={selectedRisk}
              onSelect={(r) => { setSelectedRisk(r) }}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Subtle grid background */}
          <div
            className="pointer-events-none fixed inset-0 opacity-[0.025]"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative z-10 flex flex-col gap-4 p-4 sm:p-5">
            {/* Connection status indicator */}
            <div className="flex justify-end items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[connectionStatus]}`}
                aria-hidden="true"
              />
              <span className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">
                {STATUS_LABEL[connectionStatus]}
              </span>
              {lastUpdated && connectionStatus !== 'error' && (
                <span className="font-mono text-[9px] text-gray-700">
                  · {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            {/* Signal Panel — full width */}
            <SignalPanel symbol={selectedSymbol} mode={selectedMode} risk={selectedRisk} />

            {/* Second row: TP/SL + Settings — stack on mobile */}
            <div className="grid gap-4 lg:grid-cols-2">
              <TpSlDisplay
                symbol={selectedSymbol}
                mode={selectedMode}
                risk={selectedRisk}
                leverage={settings.leverage}
                capital={settings.capital}
                direction={direction}
                currentPrice={currentPrice}
              />
              <SettingsPanel settings={settings} onSettingsChange={setSettings} />
            </div>

            {/* Third row: Support & Resistance */}
            <SRLevels symbol={selectedSymbol} />

            {/* Fourth row: Technical Indicators */}
            <IndicatorsPanel symbol={selectedSymbol} />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
