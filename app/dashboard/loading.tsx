export default function DashboardLoading() {
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

      <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto">
        {/* Symbol selector skeleton */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 skeleton rounded-full shrink-0" />
          ))}
        </div>

        {/* Signal card skeleton */}
        <div className="h-48 skeleton rounded-2xl mb-4" />

        {/* Grid skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
