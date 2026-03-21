import { Zap, Radio } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#050505]/80 backdrop-blur-md">
      <div className="flex h-10 items-center justify-between px-4 sm:px-5">
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <Zap size={12} className="text-emerald-500" aria-hidden="true" />
          Alpha Scanner &copy; 2026
          <span className="hidden sm:inline"> &bull; Multi-Asset Trading Scanner</span>
        </p>
        <div className="flex items-center gap-2">
          <Radio size={10} className="text-emerald-500" />
          <p className="text-xs text-zinc-700 font-mono tabular-nums">v0.2.0</p>
        </div>
      </div>
    </footer>
  )
}
