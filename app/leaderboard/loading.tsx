export default function LeaderboardLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#050505]">
      {/* Navbar placeholder */}
      <div className="sticky top-0 z-50 px-3 pt-3 pb-1">
        <div className="floating-navbar mx-auto max-w-6xl">
          <div className="flex h-12 items-center justify-between px-4 sm:px-5">
            <div className="h-5 w-32 skeleton rounded-full" />
            <div className="h-5 w-24 skeleton rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-6 pt-2 space-y-2">
          <div className="h-2.5 w-32 skeleton rounded" />
          <div className="h-10 w-48 skeleton rounded-lg" />
          <div className="h-10 w-36 skeleton rounded-lg" />
          <div className="h-3.5 w-72 skeleton rounded mt-2" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
          <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-2.5 w-16 skeleton rounded" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 border-b border-white/[0.04] last:border-b-0 flex items-center px-4 gap-4">
              <div className="h-3 w-6 skeleton rounded" />
              <div className="h-3 w-20 skeleton rounded" />
              <div className="h-3 w-14 skeleton rounded" />
              <div className="h-3 w-10 skeleton rounded" />
              <div className="h-3 w-16 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
