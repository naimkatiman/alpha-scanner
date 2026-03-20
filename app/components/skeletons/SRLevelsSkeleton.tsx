'use client'

export default function SRLevelsSkeleton() {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-36 rounded bg-[#1a1a1a]" />
        <div className="h-4 w-8 rounded bg-[#1a1a1a]" />
      </div>

      {/* S/R level rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-[#0a0a0a] px-3 py-2">
            <div className="h-4 w-6 rounded bg-[#1a1a1a]" />
            <div className="flex-1 h-2 rounded-full bg-[#1a1a1a]" />
            <div className="h-4 w-20 rounded bg-[#1a1a1a]" />
            <div className="h-4 w-8 rounded bg-[#1a1a1a]" />
          </div>
        ))}
      </div>
    </div>
  )
}
