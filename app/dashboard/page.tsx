'use client'

import { useState, useEffect, useCallback, lazy, Suspense, memo, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SymbolSelector from '../components/SymbolSelector'
import ModeSelector, { type TradingMode } from '../components/ModeSelector'
import RiskSelector, { type RiskProfile } from '../components/RiskSelector'
import SignalPanel from '../components/SignalPanel'
import TpSlDisplay from '../components/TpSlDisplay'
import SettingsPanel, { DEFAULT_SETTINGS, type ScannerSettings } from '../components/SettingsPanel'
import StrategyPicker, { type StrategyConfig } from '../components/StrategyPicker'
import BrokerConnect from '../components/BrokerConnect'
import PositionsPanel from '../components/PositionsPanel'
import { AlertToast } from '../components/AlertsPanel'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { PanelSkeleton } from '../components/LoadingSkeleton'
import StaleIndicator from '../components/StaleIndicator'
import { usePrices } from '../hooks/usePrices'
import { useSignals } from '../hooks/useSignals'
import { useBroker } from '../hooks/useBroker'
import { useAlerts } from '../hooks/useAlerts'
import { usePaperTrading } from '../hooks/usePaperTrading'
import { useSignalHistory } from '../hooks/useSignalHistory'
import { usePerformanceAnalytics } from '../hooks/usePerformanceAnalytics'
import { useCustomAlerts } from '../hooks/useCustomAlerts'
import { useTelegram } from '../hooks/useTelegram'
import { useCommentary } from '../hooks/useCommentary'
import SignalCommentary from '../components/SignalCommentary'
import OnboardingTour from '../components/OnboardingTour'
import OnboardingChecklist from '../components/OnboardingChecklist'
import UpgradeGate from '../components/UpgradeGate'
import LocalStorageMigration from '../components/LocalStorageMigration'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

// Lazy-loaded heavy panels
const PriceChart = lazy(() => import('../components/PriceChart'))
const SRLevels = lazy(() => import('../components/SRLevels'))
const IndicatorsPanel = lazy(() => import('../components/IndicatorsPanel'))
const AlertsPanel = lazy(() => import('../components/AlertsPanel').then(m => ({ default: m.default })))
const PaperTrading = lazy(() => import('../components/PaperTrading'))
const SignalHistory = lazy(() => import('../components/SignalHistory'))
const MultiTimeframe = lazy(() => import('../components/MultiTimeframe'))
const PerformanceAnalytics = lazy(() => import('../components/PerformanceAnalytics'))
const AlertRuleBuilder = lazy(() => import('../components/AlertRuleBuilder'))
const TelegramSettings = lazy(() => import('../components/TelegramSettings'))
const WebhookSettings = lazy(() => import('../components/WebhookSettings'))

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
  live: 'bg-emerald-500',
  stale: 'bg-yellow-400',
  loading: 'bg-zinc-500 animate-pulse',
  error: 'bg-rose-500',
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  live: 'LIVE',
  stale: 'STALE',
  loading: 'CONNECTING',
  error: 'OFFLINE',
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD')
  const [selectedMode, setSelectedMode] = useState<TradingMode>('swing')
  const [selectedRisk, setSelectedRisk] = useState<RiskProfile>('balanced')
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS)

  // DB sync for logged-in users
  const { isLoggedIn, serverData, loaded: syncLoaded, syncToServer } = useSettingsSyncContext()
  const hydratedFromDB = useRef(false)
  const hydratedFromURL = useRef(false)

  // Apply strategy config from URL params (e.g. from /strategy/[slug] share page)
  // URL params take priority over DB values
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const symbol = sp.get('symbol')
    const mode = sp.get('mode') as TradingMode | null
    const risk = sp.get('risk') as RiskProfile | null
    const leverage = sp.get('leverage')
    const capital = sp.get('capital')
    if (symbol || mode || risk || leverage || capital) {
      hydratedFromURL.current = true
      if (symbol) setSelectedSymbol(symbol)
      if (mode) setSelectedMode(mode)
      if (risk) setSelectedRisk(risk)
      if (leverage || capital) {
        setSettings((prev) => ({
          ...prev,
          ...(leverage ? { leverage: Number(leverage) } : {}),
          ...(capital ? { capital: Number(capital) } : {}),
        }))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hydrate from DB when logged in (only once, and only if URL params didn't override)
  useEffect(() => {
    if (!syncLoaded || !isLoggedIn || !serverData || hydratedFromDB.current) return
    hydratedFromDB.current = true

    // Don't override URL param values
    if (!hydratedFromURL.current) {
      if (serverData.preferredMode) setSelectedMode(serverData.preferredMode as TradingMode)
      if (serverData.riskProfile) setSelectedRisk(serverData.riskProfile as RiskProfile)
      if (serverData.leverage) setSettings((prev) => ({ ...prev, leverage: serverData.leverage }))
      if (serverData.capital) setSettings((prev) => ({ ...prev, capital: serverData.capital }))
      // Hydrate last selected symbol from watchlist[0] if available
      if (serverData.watchlist && serverData.watchlist.length > 0) {
        setSelectedSymbol(serverData.watchlist[0])
      }
    }
  }, [syncLoaded, isLoggedIn, serverData])

  // Synced setters — update local state + sync to DB for logged-in users
  const handleModeChange = useCallback((mode: TradingMode) => {
    setSelectedMode(mode)
    if (isLoggedIn) syncToServer('preferredMode', mode)
  }, [isLoggedIn, syncToServer])

  const handleRiskChange = useCallback((risk: RiskProfile) => {
    setSelectedRisk(risk)
    if (isLoggedIn) syncToServer('riskProfile', risk)
  }, [isLoggedIn, syncToServer])

  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol)
    // Persist last selected symbol as first item in watchlist
    if (isLoggedIn) syncToServer('watchlist', [symbol])
  }, [isLoggedIn, syncToServer])

  const handleSettingsChange = useCallback((newSettings: ScannerSettings) => {
    setSettings(newSettings)
    if (isLoggedIn) {
      syncToServer('leverage', newSettings.leverage)
      syncToServer('capital', newSettings.capital)
    }
  }, [isLoggedIn, syncToServer])

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

  // Performance analytics
  const perfAnalytics = usePerformanceAnalytics(
    paper.equity,
    paper.account.balance,
    paper.unrealizedPL,
  )

  // Custom alert rules
  const customAlerts = useCustomAlerts(selectedSymbol, currentPrice)

  // AI commentary
  const { commentary, loading: commentaryLoading } = useCommentary(selectedSymbol, signal ?? null, currentPrice)

  // Telegram integration
  const telegram = useTelegram()
  const prevDirectionRef = useRef<string>('')

  // Send Telegram alert on signal direction change
  useEffect(() => {
    if (!signal || signal.direction === 'NEUTRAL' || currentPrice <= 0) return
    const key = `${selectedSymbol}-${signal.direction}`
    if (prevDirectionRef.current === key) return
    prevDirectionRef.current = key

    void telegram.sendSignalAlert(
      selectedSymbol,
      signal.direction,
      signal.confidence,
      currentPrice,
      currentPrice * (signal.direction === 'BUY' ? 1.01 : 0.99),
      currentPrice * (signal.direction === 'BUY' ? 0.995 : 1.005),
    )
  }, [selectedSymbol, signal, currentPrice, telegram])

  // Signal history tracking
  const signalHistoryInput = signal && currentPrice > 0 ? {
    symbol: selectedSymbol,
    mode: selectedMode,
    risk: selectedRisk,
    direction: signal.direction,
    confidence: signal.confidence,
    entryPrice: currentPrice,
    tp1: currentPrice * (signal.direction === 'BUY' ? 1.01 : 0.99), // ~1% TP1
    sl: currentPrice * (signal.direction === 'BUY' ? 0.995 : 1.005), // ~0.5% SL
  } : null
  const signalHistory = useSignalHistory(signalHistoryInput, currentPrice)

  // Symbols with open broker positions (for highlighting in selector)
  const positionSymbols = new Set(broker.positions.map((p) => p.symbol))

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] overflow-x-hidden relative">
      {/* Ambient emerald glow */}
      <div className="ambient-glow" />
      {/* Alert toast */}
      <AlertToast alert={alerts.toastAlert} onDismiss={alerts.dismissToast} />
      <LocalStorageMigration />

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
            'overflow-y-auto glass-panel-strong border-r border-white/[0.06]',
            'transition-transform duration-300 ease-in-out will-change-transform',
            'md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
            sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          ].join(' ')}
          aria-label="Sidebar controls"
        >
          {/* Sidebar header */}
          <div className="flex h-10 items-center justify-between border-b border-white/[0.06] px-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Controls
            </span>
            <button
              onClick={closeSidebar}
              className="btn-icon rounded p-1.5 text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300 transition-colors md:hidden"
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
              onSelect={(s) => { handleSymbolChange(s); closeSidebar() }}
              prices={prices}
              pricesLoading={pricesLoading}
              positionSymbols={positionSymbols}
            />

            <ModeSelector
              selected={selectedMode}
              onSelect={(m) => { handleModeChange(m) }}
            />

            <div data-tour-step="risk">
              <RiskSelector
                selected={selectedRisk}
                onSelect={(r) => { handleRiskChange(r) }}
              />
            </div>

            {/* Strategy templates */}
            <StrategyPicker
              currentSymbol={selectedSymbol}
              currentMode={selectedMode}
              currentRisk={selectedRisk}
              currentLeverage={settings.leverage}
              currentCapital={settings.capital}
              onApply={(config: StrategyConfig) => {
                if (config.symbols?.length) handleSymbolChange(config.symbols[0])
                handleModeChange(config.mode)
                handleRiskChange(config.riskProfile)
                handleSettingsChange({
                  ...settings,
                  leverage: config.leverage,
                  capital: config.capital,
                })
              }}
            />

            {/* Broker connection */}
            <div data-tour-step="broker">
            <UpgradeGate requiredPlan="elite" featureName="Broker Integration">
            <BrokerConnect
              state={broker.state}
              account={broker.account}
              error={broker.error}
              onConnect={broker.connect}
              onDisconnect={broker.disconnect}
            />
            </UpgradeGate>
            </div>

            {/* Custom alert rules */}
            <ErrorBoundary fallbackTitle="Alert rules error">
              <Suspense fallback={<div className="h-10 rounded bg-white/[0.03] animate-pulse" />}>
                <AlertRuleBuilder
                  rules={customAlerts.rules}
                  onAddRule={customAlerts.addRule}
                  onUpdateRule={customAlerts.updateRule}
                  onDeleteRule={customAlerts.deleteRule}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Telegram alerts */}
            <div data-tour-step="alerts">
            <UpgradeGate requiredPlan="pro" featureName="Telegram Alerts">
            <ErrorBoundary fallbackTitle="Telegram error">
              <Suspense fallback={<div className="h-10 rounded bg-white/[0.03] animate-pulse" />}>
                <TelegramSettings
                  config={telegram.config}
                  sending={telegram.sending}
                  testStatus={telegram.testStatus}
                  lastError={telegram.lastError}
                  onUpdateConfig={telegram.updateConfig}
                  onTestConnection={telegram.testConnection}
                />
              </Suspense>
            </ErrorBoundary>
            </UpgradeGate>
            </div>

            {/* Plugs settings */}
            <UpgradeGate requiredPlan="pro" featureName="Webhook Configuration">
            <ErrorBoundary fallbackTitle="Plugs error">
              <Suspense fallback={<div className="h-10 rounded bg-white/[0.03] animate-pulse" />}>
                <WebhookSettings />
              </Suspense>
            </ErrorBoundary>
            </UpgradeGate>
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
            <div className="flex flex-wrap justify-end items-center gap-1.5" data-tour-step="share">
              <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[connectionStatus]}`}
                aria-hidden="true"
              />
              <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                {STATUS_LABEL[connectionStatus]}
              </span>
              {lastUpdated && connectionStatus !== 'error' && (
                <span className="font-mono text-[9px] text-zinc-700 tabular-nums">
                  · {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              {broker.state === 'connected' && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest">
                    BROKER
                  </span>
                </>
              )}
              <StaleIndicator rateLimited={rateLimited} />
            </div>

            {/* Signal Panel — full width */}
            <div data-tour-step="signal">
            <ErrorBoundary fallbackTitle="Signal panel error">
              <MemoSignalPanel symbol={selectedSymbol} mode={selectedMode} risk={selectedRisk} />
              {(commentary || commentaryLoading) && (
                <SignalCommentary
                  text={commentary?.text ?? ''}
                  isAI={commentary?.isAI ?? false}
                  loading={commentaryLoading}
                />
              )}
            </ErrorBoundary>
            </div>

            {/* Price Chart */}
            <ErrorBoundary fallbackTitle="Price chart error">
              <Suspense fallback={<PanelSkeleton />}>
                <PriceChart symbol={selectedSymbol} />
              </Suspense>
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
                <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
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

            {/* Performance Analytics */}
            <ErrorBoundary fallbackTitle="Performance analytics error">
              <Suspense fallback={<PanelSkeleton />}>
                <PerformanceAnalytics
                  snapshots={perfAnalytics.snapshots}
                  metrics={perfAnalytics.metrics}
                  onReset={perfAnalytics.resetAnalytics}
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

            {/* Signal History */}
            <ErrorBoundary fallbackTitle="Signal history error">
              <Suspense fallback={<PanelSkeleton />}>
                <SignalHistory
                  records={signalHistory.records}
                  stats={signalHistory.stats}
                  onClear={signalHistory.clearHistory}
                  getFilteredRecords={signalHistory.getFilteredRecords}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Multi-Timeframe Analysis */}
            <ErrorBoundary fallbackTitle="Multi-timeframe error">
              <Suspense fallback={<PanelSkeleton />}>
                <MultiTimeframe symbol={selectedSymbol} />
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

      {/* Onboarding */}
      <OnboardingTour autoShow />
      <OnboardingChecklist />
    </div>
  )
}
