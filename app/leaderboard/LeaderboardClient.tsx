'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Leaderboard from '../components/Leaderboard'

export default function LeaderboardClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />

      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 max-w-5xl mx-auto w-full">
        <div className="mb-6 pt-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">Performance Rankings</p>
          <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
            Signal<br />
            <span className="text-emerald-400">Leaderboard</span>
          </h1>
          <p className="mt-3 text-xs text-zinc-500 max-w-md">
            Win rates by symbol and mode, derived from resolved signal history.
          </p>
        </div>
        <Leaderboard />
      </main>

      <Footer />
    </div>
  )
}
