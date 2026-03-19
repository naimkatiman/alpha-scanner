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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD')
  const [selectedMode, setSelectedMode] = useState<TradingMode>('swing')
  const [selectedRisk, setSelectedRisk] = useState<RiskProfile>('balanced')
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS)

  return (
    <div className="flex min-h-screen flex-col bg-[--color-background]">
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'fixed top-16 bottom-0 left-0 z-40 w-[280px] flex-shrink-0',
            'overflow-y-auto border-r border-[--color-border] bg-[--color-card]',
            'transition-transform duration-300 ease-in-out',
            'md:static md:top-auto md:bottom-auto md:z-auto md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          {/* Sidebar header */}
          <div className="flex h-10 items-center justify-between border-b border-[--color-border] px-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
              Controls
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-0.5 text-gray-600 hover:text-gray-400 md:hidden"
              aria-label="Close sidebar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <SymbolSelector
              selected={selectedSymbol}
              onSelect={setSelectedSymbol}
            />

            <ModeSelector
              selected={selectedMode}
              onSelect={setSelectedMode}
            />

            <RiskSelector
              selected={selectedRisk}
              onSelect={setSelectedRisk}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Subtle grid background */}
          <div
            className="pointer-events-none fixed inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative z-10 flex flex-col gap-4 p-5">
            {/* Signal Panel — full width */}
            <SignalPanel symbol={selectedSymbol} mode={selectedMode} risk={selectedRisk} />

            {/* Second row: TP/SL + Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <TpSlDisplay symbol={selectedSymbol} mode={selectedMode} risk={selectedRisk} />

              <SettingsPanel settings={settings} onSettingsChange={setSettings} />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}


