'use client'

export default function IndicatorsPanelSkeleton() {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-40 rounded bg-[#1a1a1a]" />
        <div className="h-4 w-8 rounded bg-[#1a1a1a]" />
      </div>

      {/* RSI gauge */}
      <div className="mb-4 rounded-lg bg-[#0a0a0a] p-4">
        <div className="h-4 w-8 rounded bg-[#1a1a1a] mb-3" />
        <div className="h-3 w-full rounded-full bg-[#1a1a1a] mb-2" />
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded bg-[#1a1a1a]" />
          <div className="h-3 w-12 rounded bg-[#1a1a1a]" />
        </div>
      </div>

      {/* MACD grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-[#0a0a0a] p-3">
            <div className="h-3 w-12 rounded bg-[#1a1a1a] mb-2" />
            <div className="h-5 w-16 rounded bg-[#1a1a1a]" />
          </div>
        ))}
      </div>

      {/* EMA section */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-14 rounded bg-[#1a1a1a]" />
            <div className="flex-1 h-3 rounded bg-[#1a1a1a]" />
          </div>
        ))}
      </div>
    </div>
  )
}
