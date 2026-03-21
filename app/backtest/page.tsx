'use client'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BacktestDashboard from '../components/BacktestDashboard'

export default function BacktestPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar onMenuToggle={() => {}} />
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-white">Backtesting Engine</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Replay signals against historical data to evaluate strategy performance
          </p>
        </div>
        <BacktestDashboard />
      </main>
      <Footer />
    </div>
  )
}
