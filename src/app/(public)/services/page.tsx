// src/app/(public)/services/page.tsx
export default function ServicesPage() {
  const services = [
    { t: 'Hardware Diagnostics', d: 'Motherboard, RAM, storage, GPU failure analysis.' },
    { t: 'OS & Software Repair', d: 'Windows/Linux reinstall, virus removal, driver fixes.' },
    { t: 'Data Recovery', d: 'Dead-drive rescue, partition repair, backup.' },
    { t: 'Network Setup', d: 'Router config, cabling, secure Wi-Fi.' },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Maintenance & Repair</h1>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {services.map(s => (
          <div key={s.t} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-900">{s.t}</h2>
            <p className="text-slate-600 mt-1">{s.d}</p>
          </div>
        ))}
      </div>
      <a href="/services/request" className="inline-block mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
        Request a Repair
      </a>
    </div>
  );
}

// src/app/(public)/store/page.tsx
export default function StorePage() {
  // Fetch from Inventory sheet (only rows with public=TRUE)
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Store</h1>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Map real inventory items here */}
      </div>
    </div>
  );
}
