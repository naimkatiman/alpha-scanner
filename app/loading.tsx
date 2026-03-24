export default function RootLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#050505]">
      {/* Navbar placeholder */}
      <div className="sticky top-0 z-50 px-3 pt-3 pb-1">
        <div className="floating-navbar mx-auto max-w-6xl">
          <div className="flex h-12 items-center justify-between px-4 sm:px-5">
            <div className="h-5 w-32 skeleton rounded-full" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 skeleton rounded-full" />
              <div className="h-6 w-20 skeleton rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="px-4 pt-20 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
          <div className="space-y-6">
            <div className="h-3 w-24 skeleton rounded" />
            <div className="space-y-3">
              <div className="h-16 w-3/4 skeleton rounded-lg" />
              <div className="h-16 w-1/2 skeleton rounded-lg" />
              <div className="h-16 w-2/3 skeleton rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-4/5 skeleton rounded" />
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-36 skeleton rounded-lg" />
              <div className="h-11 w-28 skeleton rounded-lg" />
            </div>
          </div>
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </section>

      {/* Stats row skeleton */}
      <section className="px-4 pb-12 max-w-6xl mx-auto">
        <div className="flex overflow-hidden rounded-2xl border border-white/[0.04]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 px-6 py-5 border-r border-white/[0.04] last:border-r-0">
              <div className="h-2.5 w-16 skeleton rounded mb-3" />
              <div className="h-8 w-20 skeleton rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
