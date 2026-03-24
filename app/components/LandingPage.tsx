'use client'

import { useEffect, useRef, useState, memo } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import Navbar from './Navbar'
import {
  Zap,
  Globe,
  Cpu,
  BarChart3,
  Bell,
  Shield,
  Check,
  ChevronRight,
  ArrowRight,
  Activity,
  Radio,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

export interface LandingStats {
  totalSignals: number
  winRate: number
  symbols: number
  uptime: number
}

// ── Mock Signal Card (isolated client leaf component) ────────────────────
const MOCK_INDICATORS = [
  { label: 'RSI', value: '42.3', color: 'text-emerald-400' },
  { label: 'MACD', value: '+0.14', color: 'text-emerald-400' },
  { label: 'EMA', value: 'Bull', color: 'text-emerald-400' },
  { label: 'BB', value: 'Lower', color: 'text-amber-400' },
  { label: 'Stoch', value: '31.7', color: 'text-emerald-400' },
  { label: 'S/R', value: 'Near', color: 'text-zinc-500' },
]

const PulsingDot = memo(function PulsingDot() {
  return (
    <motion.div
      className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
})

const FloatingCard = memo(function FloatingCard() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      className="glass-card rounded-2xl p-5 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap size={13} className="text-emerald-500" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">XAUUSD</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider font-mono">Gold / USD</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1">
          <PulsingDot />
          <span className="text-[9px] font-bold text-emerald-400 tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Signal + confidence */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 font-mono">Signal</div>
          <div
            className="text-3xl font-black text-emerald-400 leading-none"
            style={{ textShadow: '0 0 24px rgba(16,185,129,0.5)' }}
          >
            BUY
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 font-mono">Confidence</div>
          <div className="text-3xl font-black text-white leading-none font-mono tabular-nums">78%</div>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-3 gap-1 mb-4">
        {MOCK_INDICATORS.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg bg-white/[0.03] border border-white/[0.03] p-2 text-center"
          >
            <div className="text-[8px] uppercase tracking-wider text-zinc-700 font-mono">{label}</div>
            <div className={`text-[10px] font-bold font-mono tabular-nums ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* TP / SL */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 p-2.5 text-center">
          <div className="text-[8px] uppercase tracking-wider text-zinc-600 font-mono">TP1</div>
          <div className="text-xs font-bold font-mono text-emerald-400 tabular-nums">$2,347.80</div>
        </div>
        <div className="rounded-lg bg-rose-500/[0.06] border border-rose-500/20 p-2.5 text-center">
          <div className="text-[8px] uppercase tracking-wider text-zinc-600 font-mono">SL</div>
          <div className="text-xs font-bold font-mono text-rose-400 tabular-nums">$2,318.50</div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono">Spot Price</div>
        <div className="font-mono text-sm font-bold text-white tabular-nums">$2,334.17</div>
      </div>
    </motion.div>
  )
})

// ── Features (bento-grid, 2-col, NO 3-col equal cards) ──────────────────
const FEATURES = [
  {
    Icon: Activity,
    title: '6-Factor Signal Engine',
    desc: 'RSI, MACD, EMA, support/resistance, Bollinger Bands and Stochastic — computed in real time across all symbols.',
  },
  {
    Icon: Globe,
    title: 'Multi-Asset Coverage',
    desc: '12+ symbols across Crypto, Forex and Metals. One dashboard for every market you trade.',
  },
  {
    Icon: Cpu,
    title: 'AI Market Commentary',
    desc: 'GPT-4o-mini explains every signal in plain, actionable language. No jargon, no guessing.',
  },
  {
    Icon: BarChart3,
    title: 'Backtesting Engine',
    desc: 'Validate strategies against months of historical OHLCV data before committing real capital.',
  },
  {
    Icon: Bell,
    title: 'Real-Time Alerts',
    desc: 'Browser push, Telegram bot and webhook integrations. Get notified the moment a signal fires.',
  },
  {
    Icon: Shield,
    title: 'Paper Trading',
    desc: 'Practice risk-free with a $10,000 virtual balance. Full P&L and drawdown tracking included.',
  },
]

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]"
    >
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
          className="flex gap-4 p-6 bg-[#050505] hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center mt-0.5">
            <f.Icon size={15} className="text-emerald-500" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1 tracking-tight">{f.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Animated counter ─────────────────────────────────────────────────────
function useCounter(target: number, duration = 1600) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)

  function start() {
    if (startedRef.current) return
    startedRef.current = true
    const startTime = performance.now()
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  return { count, start }
}

// Stats: cockpit-style horizontal divide row
const STATS_CONFIG = [
  { label: 'Signals Tracked', suffix: '+', decimals: 0 },
  { label: 'Win Rate', suffix: '%', decimals: 0 },
  { label: 'Symbols', suffix: '', decimals: 0 },
  { label: 'Uptime', suffix: '%', decimals: 1 },
]

function StatBlock({
  value,
  label,
  suffix,
  decimals,
}: {
  value: number
  label: string
  suffix: string
  decimals: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const { count, start } = useCounter(value)

  useEffect(() => {
    if (inView) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const display = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()

  return (
    <div ref={ref} className="flex-1 min-w-0 px-6 py-5 text-center">
      <div className="font-mono text-2xl font-black text-white tabular-nums leading-none">
        {display}
        <span className="text-emerald-400">{suffix}</span>
      </div>
      <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono mt-1.5">{label}</div>
    </div>
  )
}

function StatsSection({ stats }: { stats: LandingStats }) {
  const values = [stats.totalSignals, stats.winRate, stats.symbols, stats.uptime]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-wrap items-stretch divide-x divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden"
    >
      {STATS_CONFIG.map((cfg, i) => (
        <StatBlock
          key={cfg.label}
          value={values[i]}
          label={cfg.label}
          suffix={cfg.suffix}
          decimals={cfg.decimals}
        />
      ))}
    </motion.div>
  )
}

// ── Pricing ──────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  '100 API requests/day',
  'All trading signals',
  'Browser notifications',
  'Paper trading ($10K)',
  'Signal history',
]

const PRO_FEATURES = [
  'Unlimited API requests',
  'Webhook integrations',
  'Priority support',
  'Advanced backtesting',
  'Custom alert rules',
]

function PricingSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06] max-w-3xl w-full mx-auto">
      {/* Free */}
      <div className="flex flex-col gap-6 p-7 bg-[#050505]">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono mb-2">Free tier</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-mono tabular-nums">$0</span>
            <span className="text-sm text-zinc-600">/month</span>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5 flex-1">
          {FREE_FEATURES.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-xs text-zinc-400">
              <Check size={12} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all active:scale-[0.98] hover:scale-[1.01]"
        >
          Start for free <ChevronRight size={12} aria-hidden="true" />
        </Link>
      </div>

      {/* Pro */}
      <div className="flex flex-col gap-6 p-7 bg-[#050505] relative">
        <div className="absolute top-4 right-4">
          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5 tracking-widest uppercase font-mono">
            Soon
          </span>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono mb-2">Pro tier</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-mono tabular-nums">$9</span>
            <span className="text-sm text-zinc-600">/month</span>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5 flex-1">
          {PRO_FEATURES.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-xs text-zinc-400">
              <Check size={12} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <button
          disabled
          className="py-2.5 rounded-xl bg-zinc-900 text-zinc-600 font-bold text-xs cursor-not-allowed border border-white/[0.04]"
        >
          Coming soon
        </button>
      </div>
    </div>
  )
}

// ── Live activity ticker ─────────────────────────────────────────────────
const TICKER_ITEMS = [
  { symbol: 'BTCUSD', dir: 'BUY', conf: 74, icon: TrendingUp, color: 'text-emerald-400' },
  { symbol: 'XAUUSD', dir: 'BUY', conf: 78, icon: TrendingUp, color: 'text-emerald-400' },
  { symbol: 'EURUSD', dir: 'SELL', conf: 71, icon: TrendingDown, color: 'text-rose-400' },
  { symbol: 'ETHUSD', dir: 'BUY', conf: 69, icon: TrendingUp, color: 'text-emerald-400' },
  { symbol: 'XAGUSD', dir: 'SELL', conf: 66, icon: TrendingDown, color: 'text-rose-400' },
  { symbol: 'GBPUSD', dir: 'BUY', conf: 72, icon: TrendingUp, color: 'text-emerald-400' },
]

const InfiniteTickerInner = memo(function InfiniteTickerInner() {
  return (
    <motion.div
      className="flex gap-3"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
    >
      {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
        <div
          key={i}
          className="flex-shrink-0 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5"
        >
          <item.icon size={10} className={item.color} aria-hidden="true" />
          <span className="text-[10px] font-bold text-white font-mono">{item.symbol}</span>
          <span className={`text-[10px] font-bold ${item.color} font-mono`}>{item.dir}</span>
          <span className="text-[10px] text-zinc-500 font-mono tabular-nums">{item.conf}%</span>
        </div>
      ))}
    </motion.div>
  )
})

function LiveTicker() {
  return (
    <div className="overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <InfiniteTickerInner />
    </div>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] mt-24 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-8">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Demo', href: '/demo' },
            { label: 'Leaderboard', href: '/leaderboard' },
            { label: 'Feed', href: '/feed' },
            { label: 'API Docs', href: '/api-keys' },
            { label: 'GitHub', href: 'https://github.com/naimkatiman/alpha-scanner' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="text-center text-[11px] text-zinc-700 font-mono">
          Alpha Scanner &copy; 2026 &mdash; Multi-Asset Trading Signal Platform
        </p>
      </div>
    </footer>
  )
}

// ── Root Landing Page ─────────────────────────────────────────────────────
export default function LandingPage({ stats }: { stats: LandingStats }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] overflow-x-hidden relative">
      {/* Ambient glows — fixed, pointer-events-none pseudo-elements */}
      <div
        className="pointer-events-none fixed top-0 left-[5%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-0 right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      <Navbar onMenuToggle={() => {}} />

      <main className="flex-1">
        {/* ── Hero: split-screen, left-aligned (ANTI-CENTER BIAS) ── */}
        <section className="relative px-4 pt-16 pb-20 md:pt-20 md:pb-28">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-center">

            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-7"
            >
              {/* Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 tracking-wider uppercase font-mono">
                  <Radio size={9} className="text-emerald-500 animate-pulse" aria-hidden="true" />
                  Live signals
                </span>
              </div>

              {/* Headline — NO gradient, weight + color hierarchy */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.92] tracking-tighter text-white">
                Trade on<br />
                <span className="text-emerald-400">signal.</span><br />
                Not noise.
              </h1>

              {/* Subtitle */}
              <p className="text-base text-zinc-400 leading-relaxed max-w-[52ch]">
                Real-time technical analysis across Crypto, Forex and Metals — driven by a
                6-factor signal engine with AI commentary, backtesting, and broker integration.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all active:scale-[0.98] hover:scale-[1.02]"
                >
                  Launch Dashboard <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.1] text-zinc-300 font-semibold text-sm transition-all hover:bg-white/[0.04] hover:border-white/[0.18] active:scale-[0.98]"
                >
                  Try Demo
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-5 pt-1">
                {[
                  { Icon: Shield, label: 'No signup required' },
                  { Icon: Activity, label: 'Free forever tier' },
                  { Icon: Zap, label: '12 live symbols' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={11} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs text-zinc-500">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: floating signal card */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="w-full"
            >
              <FloatingCard />
            </motion.div>
          </div>
        </section>

        {/* ── Live ticker ──────────────────────────────────────── */}
        <section className="pb-12 px-0">
          <LiveTicker />
        </section>

        {/* ── Stats: cockpit-dense row ─────────────────────────── */}
        <section className="px-4 pb-20 max-w-6xl mx-auto w-full">
          <StatsSection stats={stats} />
        </section>

        {/* ── Features: bento-grid 2-col ───────────────────────── */}
        <section className="px-4 py-16 max-w-6xl mx-auto w-full">
          <div className="mb-10">
            <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono mb-3">Capabilities</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
              Signals. Analysis. Execution.
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-[48ch] leading-relaxed">
              Every tool a systematic trader needs, without the noise.
            </p>
          </div>
          <FeaturesSection />
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section className="px-4 py-16 max-w-6xl mx-auto w-full">
          <div className="mb-10">
            <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono mb-3">Pricing</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
              Start free. Scale when ready.
            </h2>
          </div>
          <PricingSection />
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
