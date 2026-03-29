import Link from 'next/link'
import { Lightning, Radio } from '@phosphor-icons/react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#050505]/80 backdrop-blur-md">
      <div className="flex h-10 items-center justify-between px-4 sm:px-5">
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <Lightning size={12} className="text-emerald-500" aria-hidden="true" />
          Alpha Scanner &copy; {new Date().getFullYear()}
          <span className="hidden sm:inline"> &bull; Multi-Asset Trading Scanner</span>
        </p>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors hidden sm:inline">Pricing</Link>
          <Link href="/demo" className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors hidden sm:inline">Demo</Link>
          <div className="flex items-center gap-1.5">
            <Radio size={10} className="text-emerald-500" />
            <p className="text-xs text-zinc-700 font-mono tabular-nums">v1.0.0</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
