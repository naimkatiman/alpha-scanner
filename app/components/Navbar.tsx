'use client'

import Link from 'next/link'
import { Menu, X, Settings, Zap, BarChart3, Trophy, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import UserMenu from './UserMenu'

interface NavbarProps {
  onMenuToggle: () => void
  sidebarOpen?: boolean
}

export default function Navbar({ onMenuToggle, sidebarOpen = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 h-16 glass-panel-strong border-b border-white/[0.06]">
      <div className="flex h-full items-center justify-between px-4 sm:px-5">
        {/* Logo + hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="btn-icon flex items-center justify-center rounded-md p-2 text-zinc-400 transition-all duration-200 hover:bg-white/[0.05] hover:text-white active:scale-95 md:hidden"
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
                  <X size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 text-white transition-opacity hover:opacity-80"
            aria-label="Alpha Scanner home"
          >
            <Zap size={20} className="text-emerald-500" aria-hidden="true" />
            <span className="font-bold tracking-tight text-sm sm:text-base">Alpha Scanner</span>
          </Link>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-1" aria-label="Top navigation">
          <Link
            href="/backtest"
            className="hidden rounded-md px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 sm:flex items-center gap-1.5"
          >
            <BarChart3 size={14} />
            Backtest
          </Link>
          <Link
            href="/leaderboard"
            className="hidden rounded-md px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 sm:flex items-center gap-1.5"
          >
            <Trophy size={14} />
            Leaderboard
          </Link>

          <div className="mx-1 hidden h-4 w-px bg-white/[0.06] sm:block" aria-hidden="true" />

          {/* Settings icon */}
          <button
            className="btn-icon flex items-center justify-center rounded-md p-2 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>

          {/* Live badge */}
          <div className="ml-1 flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
            <Radio size={10} className="text-emerald-500" />
            <span className="text-xs font-medium text-zinc-400 leading-none">Live</span>
          </div>

          <div className="mx-1 hidden h-4 w-px bg-white/[0.06] sm:block" aria-hidden="true" />

          {/* User menu */}
          <UserMenu />
        </nav>
      </div>
    </header>
  )
}
