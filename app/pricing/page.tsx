'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lightning, Check, Minus, Crown, Rocket } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePlan } from '@/app/hooks/usePlan'

const PLANS = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  elite: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID,
    annual: process.env.NEXT_PUBLIC_STRIPE_ELITE_ANNUAL_PRICE_ID,
  },
}

const features = [
  { name: 'Daily signals', free: '3 / day', pro: 'Unlimited', elite: 'Unlimited' },
  { name: 'Assets tracked', free: '5 assets', pro: 'All 12+', elite: 'All 12+' },
  { name: 'Trading modes', free: 'Swing only', pro: 'All modes', elite: 'All modes' },
  { name: 'Technical indicators', free: true, pro: true, elite: true },
  { name: 'Paper trading', free: true, pro: true, elite: true },
  { name: 'Backtesting', free: false, pro: true, elite: true },
  { name: 'Webhook alerts', free: false, pro: true, elite: true },
  { name: 'Telegram bot', free: false, pro: true, elite: true },
  { name: 'API access', free: false, pro: true, elite: true },
  { name: 'Broker integration', free: false, pro: false, elite: true },
  { name: 'Priority support', free: false, pro: false, elite: true },
  { name: 'Custom strategies', free: false, pro: false, elite: true },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-zinc-300 text-sm">{value}</span>
  }
  return value ? (
    <Check size={16} weight="bold" className="text-emerald-400" />
  ) : (
    <Minus size={14} className="text-zinc-600" />
  )
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const { plan: currentPlan, stripeCustomerId, isLoading } = usePlan()

  const proPrice = annual ? 24 : 29
  const elitePrice = annual ? 79 : 99

  async function handleCheckout(priceId: string | undefined) {
    if (!priceId) return
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handlePortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[30%] h-[600px] w-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] h-[400px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Lightning size={20} className="text-emerald-500" />
            <span className="font-bold tracking-tight text-gradient-emerald">Alpha Scanner</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center pt-12 pb-8 px-4"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
          Choose your{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            edge
          </span>
        </h1>
        <p className="mt-4 text-zinc-500 text-base max-w-lg mx-auto leading-relaxed">
          Unlock unlimited signals, all assets, and advanced tools to stay ahead of the market.
        </p>

        {/* Annual / Monthly toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.02] px-1.5 py-1.5">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              !annual ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all flex items-center gap-2 ${
              annual ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Save 17%
            </span>
          </button>
        </div>
      </motion.section>

      {/* Pricing cards */}
      <section className="relative z-10 px-4 pb-16">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <p className="text-xs text-zinc-500 mt-1">Get started with basics</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-zinc-600 text-sm ml-1">/month</span>
            </div>
            <div className="flex-1 space-y-3 mb-6">
              {features.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{f.name}</span>
                  <FeatureValue value={f.free} />
                </div>
              ))}
            </div>
            {currentPlan === 'free' || !currentPlan ? (
              <div className="rounded-full border border-white/[0.06] bg-white/[0.03] py-2.5 text-center text-xs font-medium text-zinc-500">
                Current Plan
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-full border border-white/[0.06] bg-white/[0.03] py-2.5 text-center text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all block"
              >
                Get Started
              </Link>
            )}
          </motion.div>

          {/* Pro — recommended */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-emerald-500/20 bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col relative overflow-hidden"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_0_60px_-12px_rgba(16,185,129,0.15)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="mb-6 relative">
              <div className="flex items-center gap-2">
                <Rocket size={18} weight="fill" className="text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Pro</h3>
              </div>
              <div className="absolute -top-1 right-0">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">For serious traders</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${proPrice}</span>
              <span className="text-zinc-600 text-sm ml-1">/{annual ? 'mo' : 'month'}</span>
              {annual && (
                <span className="ml-2 text-xs text-zinc-600 line-through">${29}/mo</span>
              )}
            </div>
            <div className="flex-1 space-y-3 mb-6">
              {features.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{f.name}</span>
                  <FeatureValue value={f.pro} />
                </div>
              ))}
            </div>
            {currentPlan === 'pro' && stripeCustomerId ? (
              <button
                onClick={handlePortal}
                className="rounded-full bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-center text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                Manage Subscription
              </button>
            ) : currentPlan === 'elite' ? (
              <div className="rounded-full border border-white/[0.06] bg-white/[0.03] py-2.5 text-center text-xs font-medium text-zinc-500">
                Included in Elite
              </div>
            ) : (
              <button
                onClick={() =>
                  handleCheckout(annual ? PLANS.pro.annual : PLANS.pro.monthly)
                }
                disabled={isLoading || !PLANS.pro.monthly}
                className="rounded-full bg-emerald-500 py-2.5 text-center text-xs font-semibold text-black hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {PLANS.pro.monthly ? 'Subscribe to Pro' : 'Coming Soon'}
              </button>
            )}
          </motion.div>

          {/* Elite */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-purple-500/20 bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Crown size={18} weight="fill" className="text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Elite</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Full arsenal unlocked</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${elitePrice}</span>
              <span className="text-zinc-600 text-sm ml-1">/{annual ? 'mo' : 'month'}</span>
              {annual && (
                <span className="ml-2 text-xs text-zinc-600 line-through">${99}/mo</span>
              )}
            </div>
            <div className="flex-1 space-y-3 mb-6">
              {features.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{f.name}</span>
                  <FeatureValue value={f.elite} />
                </div>
              ))}
            </div>
            {currentPlan === 'elite' && stripeCustomerId ? (
              <button
                onClick={handlePortal}
                className="rounded-full bg-purple-500/10 border border-purple-500/20 py-2.5 text-center text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={() =>
                  handleCheckout(annual ? PLANS.elite.annual : PLANS.elite.monthly)
                }
                disabled={isLoading || !PLANS.elite.monthly}
                className="rounded-full bg-purple-500 py-2.5 text-center text-xs font-semibold text-white hover:bg-purple-400 transition-all disabled:opacity-50"
              >
                {PLANS.elite.monthly ? 'Subscribe to Elite' : 'Coming Soon'}
              </button>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
