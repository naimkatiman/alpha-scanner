export default function AccuracyLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <div className="h-4 w-16 skeleton rounded" />
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="h-3.5 w-32 skeleton rounded" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page title skeleton */}
        <div className="mb-8 space-y-2">
          <div className="h-2.5 w-24 skeleton rounded" />
          <div className="h-10 w-44 skeleton rounded-lg" />
          <div className="h-10 w-32 skeleton rounded-lg" />
          <div className="h-3.5 w-64 skeleton rounded mt-2" />
        </div>

        {/* Stats row skeleton */}
        <div className="flex overflow-hidden rounded-2xl border border-white/[0.04] mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 px-5 py-4 border-r border-white/[0.04] last:border-r-0">
              <div className="h-2.5 w-12 skeleton rounded mb-2" />
              <div className="h-7 w-16 skeleton rounded" />
            </div>
          ))}
        </div>

        {/* Symbol rows skeleton */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0">
              <div className="h-3 w-24 skeleton rounded" />
              <div className="flex-1 h-1.5 skeleton rounded-full" />
              <div className="h-4 w-10 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
