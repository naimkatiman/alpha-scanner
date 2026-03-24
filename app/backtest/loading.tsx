export default function BacktestLoading() {
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

      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header skeleton */}
        <div className="mb-6 pt-2 space-y-2">
          <div className="h-2.5 w-32 skeleton rounded" />
          <div className="h-10 w-44 skeleton rounded-lg" />
          <div className="h-10 w-28 skeleton rounded-lg" />
          <div className="h-3.5 w-80 skeleton rounded mt-2" />
        </div>

        {/* Controls skeleton */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-32 skeleton rounded-lg" />
          ))}
        </div>

        {/* Results skeleton */}
        <div className="h-64 skeleton rounded-xl mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
