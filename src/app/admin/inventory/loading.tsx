// src/app/admin/inventory/loading.tsx
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="animate-pulse space-y-4">
        {/* Header skeleton */}
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <div className="aspect-square bg-slate-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
