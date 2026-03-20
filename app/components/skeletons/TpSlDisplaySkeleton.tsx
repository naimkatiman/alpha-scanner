'use client'

export default function TpSlDisplaySkeleton() {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 rounded bg-[#1a1a1a]" />
        <div className="h-4 w-12 rounded bg-[#1a1a1a]" />
      </div>

      {/* Price ladder */}
      <div className="space-y-3 mb-4">
        {['TP3', 'TP2', 'TP1', 'Entry', 'SL'].map((label) => (
          <div key={label} className="flex items-center gap-3">
            <div className="h-5 w-10 rounded bg-[#1a1a1a]" />
            <div className="flex-1 h-3 rounded-full bg-[#1a1a1a]" />
            <div className="h-5 w-20 rounded bg-[#1a1a1a]" />
          </div>
        ))}
      </div>

      {/* R:R Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-[#0a0a0a] p-3">
            <div className="h-3 w-12 rounded bg-[#1a1a1a] mb-2" />
            <div className="h-5 w-16 rounded bg-[#1a1a1a]" />
          </div>
        ))}
      </div>
    </div>
  )
}
