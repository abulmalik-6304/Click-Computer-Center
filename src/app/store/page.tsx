export default function StorePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Store</h1>
      <p className="mt-3 text-slate-600">Browse our collection.</p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="aspect-square bg-slate-100" />
            <div className="p-4">
              <h2 className="font-bold text-slate-900">Product {i}</h2>
              <p className="text-sm text-slate-500 mt-1">Coming soon</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
