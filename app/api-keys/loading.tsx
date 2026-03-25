export default function ApiKeysLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#050505]">
      <div className="sticky top-0 z-50 px-3 pt-3 pb-1">
        <div className="floating-navbar mx-auto max-w-6xl">
          <div className="flex h-12 items-center justify-between px-4 sm:px-5">
            <div className="h-5 w-32 skeleton rounded-full" />
            <div className="h-5 w-24 skeleton rounded-full" />
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto">
        <div className="h-8 w-40 skeleton rounded-full mb-6" />
        <div className="h-32 skeleton rounded-2xl mb-4" />
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
