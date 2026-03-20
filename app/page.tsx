'use client'

import { useState, lazy, Suspense, memo } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SymbolSelector from './components/SymbolSelector'
import ModeSelector, { type TradingMode } from './components/ModeSelector'
import RiskSelector, { type RiskProfile } from './components/RiskSelector'
import SignalPanel from './components/SignalPanel'
import TpSlDisplay from './components/TpSlDisplay'
import SettingsPanel, { DEFAULT_SETTINGS, type ScannerSettings } from './components/SettingsPanel'
import BrokerConnect from './components/BrokerConnect'
import PositionsPanel from './components/PositionsPanel'
import { AlertToast } from './components/AlertsPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PanelSkeleton } from './components/LoadingSkeleton'
import StaleIndicator from './components/StaleIndicator'
import { usePrices } from './hooks/usePrices'
import { useSignals } from './hooks/useSignals'
import { useBroker } from './hooks/useBroker'
import { useAlerts } from './hooks/useAlerts'
import { usePaperTrading } from './hooks/usePaperTrading'

// Lazy-loaded heavy panels
const SRLevels = lazy(() => import('./components/SRLevels'))
const IndicatorsPanel = lazy(() => import('./components/IndicatorsPanel'))
const AlertsPanel = lazy(() => import('./components/AlertsPanel').then(m => ({ default: m.default })))
const PaperTrading = lazy(() => import('./components/PaperTrading'))

// Memoized pure display components
const MemoSignalPanel = memo(SignalPanel)
const MemoTpSlDisplay = memo(TpSlDisplay)
const MemoPositionsPanel = memo(PositionsPanel)

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

  const { prices, loading: pricesLoading, error: pricesError, lastUpdated, rateLimited } = usePrices()
  const { signal } = useSignals(selectedSymbol, selectedMode, selectedRisk)
  const connectionStatus = getConnectionStatus(pricesLoading, pricesError, lastUpdated)

  // Phase 4 hooks
  const broker = useBroker()
  const alerts = useAlerts(selectedMode)
  const paper = usePaperTrading(
    prices,
    signal?.direction,
    selectedSymbol,
  )

  const currentPrice = prices?.[selectedSymbol]?.price ?? 0
  const direction = signal?.direction ?? 'NEUTRAL'

  // Symbols with open broker positions (for highlighting in selector)
  const positionSymbols = new Set(broker.positions.map((p) => p.symbol))

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] overflow-x-hidden">
      {/* Alert toast */}
      <AlertToast alert={alerts.toastAlert} onDismiss={alerts.dismissToast} />

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
              positionSymbols={positionSymbols}
            />

            <ModeSelector
              selected={selectedMode}
              onSelect={(m) => { setSelectedMode(m) }}
            />

            <RiskSelector
              selected={selectedRisk}
              onSelect={(r) => { setSelectedRisk(r) }}
            />

            {/* Broker connection */}
            <BrokerConnect
              state={broker.state}
              account={broker.account}
              error={broker.error}
              onConnect={broker.connect}
              onDisconnect={broker.disconnect}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <ErrorBoundary>
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

          <div className="relative z-10 flex flex-col gap-4 p-3 sm:p-4 md:p-5">
            {/* Connection status indicator */}
            <div className="flex flex-wrap justify-end items-center gap-1.5">
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
              {broker.state === 'connected' && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                  <span className="font-mono text-[9px] text-[#8b5cf6] uppercase tracking-widest">
                    BROKER
                  </span>
                </>
              )}
              <StaleIndicator rateLimited={rateLimited} />
            </div>

            {/* Signal Panel — full width */}
            <ErrorBoundary fallbackTitle="Signal panel error">
              <MemoSignalPanel symbol={selectedSymbol} mode={selectedMode} risk={selectedRisk} />
            </ErrorBoundary>

            {/* Second row: TP/SL + Settings — stack on mobile */}
            <div className="grid gap-4 lg:grid-cols-2">
              <ErrorBoundary fallbackTitle="TP/SL error">
                <MemoTpSlDisplay
                  symbol={selectedSymbol}
                  mode={selectedMode}
                  risk={selectedRisk}
                  leverage={settings.leverage}
                  capital={settings.capital}
                  direction={direction}
                  currentPrice={currentPrice}
                />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="Settings error">
                <SettingsPanel settings={settings} onSettingsChange={setSettings} />
              </ErrorBoundary>
            </div>

            {/* Broker positions (only when connected) */}
            <ErrorBoundary fallbackTitle="Positions error">
              <MemoPositionsPanel
                state={broker.state}
                positions={broker.positions}
                totalProfit={broker.totalProfit}
              />
            </ErrorBoundary>

            {/* Paper trading */}
            <ErrorBoundary fallbackTitle="Paper trading error">
              <Suspense fallback={<PanelSkeleton />}>
                <PaperTrading
                  enabled={paper.enabled}
                  autoTrade={paper.autoTrade}
                  account={paper.account}
                  equity={paper.equity}
                  unrealizedPL={paper.unrealizedPL}
                  stats={paper.stats}
                  lotSize={paper.lotSize}
                  selectedSymbol={selectedSymbol}
                  currentPrice={currentPrice}
                  onSetLotSize={paper.setLotSize}
                  onToggleEnabled={paper.toggleEnabled}
                  onToggleAutoTrade={paper.toggleAutoTrade}
                  onOpenTrade={paper.openTrade}
                  onCloseTrade={paper.closeTrade}
                  onCloseAll={paper.closeAllTrades}
                  onReset={paper.resetAccount}
                  prices={prices}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Signal alerts */}
            <ErrorBoundary fallbackTitle="Alerts error">
              <Suspense fallback={<PanelSkeleton />}>
                <AlertsPanel
                  watchlist={alerts.watchlist}
                  alerts={alerts.alerts}
                  notificationsEnabled={alerts.notificationsEnabled}
                  onToggleWatch={alerts.toggleWatchlist}
                  onClearAlerts={alerts.clearAlerts}
                  onEnableNotifications={alerts.enableNotifications}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Support & Resistance */}
            <ErrorBoundary fallbackTitle="S/R levels error">
              <Suspense fallback={<PanelSkeleton />}>
                <SRLevels symbol={selectedSymbol} />
              </Suspense>
            </ErrorBoundary>

            {/* Technical Indicators */}
            <ErrorBoundary fallbackTitle="Indicators error">
              <Suspense fallback={<PanelSkeleton />}>
                <IndicatorsPanel symbol={selectedSymbol} />
              </Suspense>
            </ErrorBoundary>
          </div>
          </ErrorBoundary>
        </main>
      </div>

      <Footer />
    </div>
  )
}
