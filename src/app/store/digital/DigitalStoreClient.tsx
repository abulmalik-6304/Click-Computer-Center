// src/app/store/digital/DigitalStoreClient.tsx
"use client";

import { useMemo, useState } from "react";
import DigitalProductCard from "@/components/public/DigitalProductCard";

export default function DigitalStoreClient({ initialProducts, categories }: { initialProducts: any[]; categories: string[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialProducts.filter((p) => {
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchQ && matchCat;
    });
  }, [initialProducts, search, categoryFilter]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header — Gradient */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">💎 Digital Products</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            E-books, templates, and software — instant download after payment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search digital products…" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategoryFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${categoryFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>All ({initialProducts.length})</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${categoryFilter === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-4xl mb-3">💎</p>
            <p className="text-slate-500">No digital products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <DigitalProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
