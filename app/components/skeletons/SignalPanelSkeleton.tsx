'use client'

export default function SignalPanelSkeleton() {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 rounded bg-[#1a1a1a]" />
          <div className="h-5 w-16 rounded bg-[#1a1a1a]" />
        </div>
        <div className="h-5 w-12 rounded bg-[#1a1a1a]" />
      </div>

      {/* Direction badge */}
      <div className="mb-4 flex items-center gap-4">
        <div className="h-10 w-24 rounded-lg bg-[#1a1a1a]" />
        <div className="flex-1">
          <div className="h-3 w-32 rounded bg-[#1a1a1a] mb-2" />
          <div className="h-2 w-full rounded-full bg-[#1a1a1a]" />
        </div>
      </div>

      {/* Indicator badges */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-16 rounded bg-[#1a1a1a]" />
        ))}
      </div>

      {/* Analysis reason */}
      <div className="rounded-lg bg-[#0a0a0a] p-3">
        <div className="h-3 w-full rounded bg-[#1a1a1a] mb-2" />
        <div className="h-3 w-3/4 rounded bg-[#1a1a1a]" />
      </div>
    </div>
  )
}
