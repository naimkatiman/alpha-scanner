'use client'

import Link from 'next/link'
import { Menu, X, Settings, Zap, BarChart3, Trophy, Radio, Target, Rss } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import UserMenu from './UserMenu'

interface NavbarProps {
  onMenuToggle: () => void
  sidebarOpen?: boolean
}

export default function Navbar({ onMenuToggle, sidebarOpen = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 pb-1">
      {/* Floating glass pill navbar */}
      <div className="floating-navbar mx-auto max-w-6xl">
        <div className="flex h-12 items-center justify-between px-4 sm:px-5">
          {/* Logo + hamburger */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={onMenuToggle}
              className="btn-icon flex items-center justify-center rounded-full p-1.5 text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-95 md:hidden"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={sidebarOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {sidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X size={16} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 text-white transition-opacity hover:opacity-80"
              aria-label="Alpha Scanner home"
            >
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Zap size={18} className="text-emerald-500" aria-hidden="true" />
              </motion.div>
              <span className="font-bold tracking-tight text-sm text-gradient-emerald">Alpha Scanner</span>
            </Link>
          </div>

          {/* Right nav */}
          <nav className="flex items-center gap-0.5" aria-label="Top navigation">
            <Link
              href="/backtest"
              className="hidden rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-zinc-300 sm:flex items-center gap-1.5"
            >
              <BarChart3 size={13} />
              Backtest
            </Link>
            <Link
              href="/leaderboard"
              className="hidden rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-zinc-300 sm:flex items-center gap-1.5"
            >
              <Trophy size={13} />
              Leaderboard
            </Link>
            <Link
              href="/accuracy"
              className="hidden rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-zinc-300 sm:flex items-center gap-1.5"
            >
              <Target size={13} />
              Accuracy
            </Link>
            <Link
              href="/feed"
              className="hidden rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-zinc-300 sm:flex items-center gap-1.5"
            >
              <Rss size={13} />
              Feed
            </Link>

            <div className="mx-1 hidden h-3 w-px bg-white/[0.06] sm:block" aria-hidden="true" />

            {/* Live badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1">
              <Radio size={8} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 leading-none tracking-wider">LIVE</span>
            </div>

            <div className="mx-1 hidden h-3 w-px bg-white/[0.06] sm:block" aria-hidden="true" />

            {/* User menu */}
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}
