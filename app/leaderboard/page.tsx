'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Leaderboard from '../components/Leaderboard'

export default function LeaderboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />

      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Signal Leaderboard</h1>
          <p className="text-xs text-zinc-500">
            Rankings based on your local signal history — win rates by symbol and mode.
          </p>
        </div>
        <Leaderboard />
      </main>

      <Footer />
    </div>
  )
}
