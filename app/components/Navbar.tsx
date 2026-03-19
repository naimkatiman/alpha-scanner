'use client'

import Link from 'next/link'

interface NavbarProps {
  onMenuToggle: () => void
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[--color-border] bg-[--color-card]">
      <div className="flex h-full items-center justify-between px-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[--color-card-alt] hover:text-white md:hidden"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-xl leading-none text-[--color-buy]">⚡</span>
            <span className="font-bold tracking-tight">Alpha Scanner</span>
          </Link>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-1">
          <button className="hidden rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[--color-card-alt] hover:text-gray-300 sm:block">
            Markets
          </button>
          <button className="hidden rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[--color-card-alt] hover:text-gray-300 sm:block">
            Alerts
          </button>

          <div className="mx-2 hidden h-4 w-px bg-[--color-border-subtle] sm:block" />

          {/* Settings */}
          <button
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[--color-card-alt] hover:text-white"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Status dot */}
          <div className="ml-1 flex items-center gap-1.5 rounded-full border border-[--color-border] bg-[--color-card-alt] px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[--color-teal] shadow-[0_0_4px_var(--color-teal)]" />
            <span className="text-xs font-medium text-gray-400">Live</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
