'use client'

import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SymbolSelector from './components/SymbolSelector'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD')

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

            <SidebarCard
              title="Mode Selector"
              label="Strategy"
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            >
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Swing', color: '#3b82f6' },
                  { label: 'Intraday', color: '#14b8a6' },
                  { label: 'Scalper', color: '#a855f7' },
                ].map(({ label, color }) => (
                  <button
                    key={label}
                    className="rounded border px-2 py-1.5 text-[10px] font-semibold transition-opacity hover:opacity-70"
                    style={{ borderColor: color, color }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </SidebarCard>

            <SidebarCard
              title="Risk Profile"
              label="Exposure"
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            >
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Conservative', pct: '1%', color: '#14b8a6' },
                  { label: 'Moderate', pct: '2%', color: '#3b82f6' },
                  { label: 'Aggressive', pct: '5%', color: '#ef4444' },
                ].map(({ label, pct, color }) => (
                  <button
                    key={label}
                    className="flex items-center justify-between rounded border border-[--color-border] bg-[--color-card-alt] px-3 py-2 text-xs transition-colors hover:border-[--color-border-subtle]"
                  >
                    <span className="text-gray-400">{label}</span>
                    <span className="font-mono font-semibold" style={{ color }}>{pct}</span>
                  </button>
                ))}
              </div>
            </SidebarCard>
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
            <PlaceholderCard
              title="Signal Panel"
              description="Live trading signals • Awaiting scanner engine"
              accent="buy"
              tall
            >
              <div className="mt-4 flex gap-3">
                {['BUY', 'NEUTRAL', 'SELL'].map((sig) => (
                  <div
                    key={sig}
                    className="flex flex-1 items-center justify-center rounded-md border border-[--color-border] bg-[--color-card-alt] py-4"
                  >
                    <span
                      className="text-xs font-bold tracking-widest"
                      style={{
                        color:
                          sig === 'BUY' ? '#3b82f6' : sig === 'SELL' ? '#ef4444' : '#6b7280',
                      }}
                    >
                      {sig}
                    </span>
                  </div>
                ))}
              </div>
            </PlaceholderCard>

            {/* Second row: TP/SL + Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <PlaceholderCard
                title="TP / SL Display"
                description="Take profit & stop loss levels"
                accent="teal"
              >
                <div className="mt-4 space-y-2">
                  <LevelRow label="Take Profit 1" value="—" color="#14b8a6" />
                  <LevelRow label="Take Profit 2" value="—" color="#3b82f6" />
                  <LevelRow label="Stop Loss" value="—" color="#ef4444" />
                </div>
              </PlaceholderCard>

              <PlaceholderCard
                title="Settings"
                description="Scanner configuration & parameters"
                accent="muted"
              >
                <div className="mt-4 space-y-2">
                  {['Timeframe', 'Confluence', 'Notifications'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded border border-[--color-border] bg-[--color-card-alt] px-3 py-2"
                    >
                      <span className="text-xs text-gray-500">{item}</span>
                      <span className="h-2 w-12 rounded bg-[--color-border-subtle]" />
                    </div>
                  ))}
                </div>
              </PlaceholderCard>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}

/* ── Sidebar card ─────────────────────────────────────────────────────────── */

function SidebarCard({
  title,
  label,
  icon,
  children,
}: {
  title: string
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-card-alt] p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        <div>
          <p className="text-xs font-semibold text-white">{title}</p>
          <p className="text-[10px] text-gray-600">{label}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── Main content card ────────────────────────────────────────────────────── */

function PlaceholderCard({
  title,
  description,
  accent,
  tall,
  children,
}: {
  title: string
  description: string
  accent: 'buy' | 'teal' | 'sell' | 'muted'
  tall?: boolean
  children?: React.ReactNode
}) {
  const accentColor = {
    buy: '#3b82f6',
    teal: '#14b8a6',
    sell: '#ef4444',
    muted: '#374151',
  }[accent]

  return (
    <div
      className={`rounded-lg border border-[--color-border] bg-[--color-card] p-5 ${tall ? 'min-h-[180px]' : 'min-h-[140px]'}`}
      style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-600">{description}</p>
        </div>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 4px ${accentColor}` }}
        />
      </div>
      {children}
    </div>
  )
}

/* ── TP/SL row ────────────────────────────────────────────────────────────── */

function LevelRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-[--color-border] bg-[--color-card-alt] px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-mono text-xs font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
