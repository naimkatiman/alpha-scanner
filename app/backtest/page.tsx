'use client'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BacktestDashboard from '../components/BacktestDashboard'

export default function BacktestPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar onMenuToggle={() => {}} />
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="mb-6 pt-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">Strategy Research</p>
          <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
            Backtest<br />
            <span className="text-emerald-400">Engine</span>
          </h1>
          <p className="mt-3 text-xs text-zinc-500 max-w-md">
            Replay signals against historical data to evaluate strategy performance.
          </p>
        </div>
        <BacktestDashboard />
      </main>
      <Footer />
    </div>
  )
}
