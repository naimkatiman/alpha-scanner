'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, LogOut, LogIn } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 rounded-full bg-white/[0.05] animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Login</span>
      </Link>
    )
  }

  const initials = (session.user.name || session.user.email || 'U')
    .split(/[\s@]/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/30"
        title={session.user.email || ''}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/[0.08] bg-zinc-900/95 p-1 shadow-xl backdrop-blur-sm z-50">
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="text-sm font-medium text-white truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
