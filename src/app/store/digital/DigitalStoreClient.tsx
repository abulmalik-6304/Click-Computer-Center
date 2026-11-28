// src/app/store/digital/DigitalStoreClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";
import DigitalProductsGrid from "@/components/public/DigitalProductsGrid";

export default function DigitalStoreClient({
  initialProducts,
  categories,
}: {
  initialProducts: any[];
  categories: string[];
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeProduct, setActiveProduct] = useState<any>(null);

  // Listen to "similar product" event from DetailModal
  useEffect(() => {
    function handleOpen(e: any) {
      setActiveProduct(e.detail);
    }
    window.addEventListener("openDigitalProduct", handleOpen);
    return () => window.removeEventListener("openDigitalProduct", handleOpen);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialProducts.filter((p) => {
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchQ && matchCat;
    });
  }, [initialProducts, search, categoryFilter]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            {t("digital.title")}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            {t("digital.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                categoryFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {t("common.all")} ({initialProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-4xl mb-3">💎</p>
            <p className="text-slate-500">{t("common.noResults")}</p>
          </div>
        ) : (
          <DigitalProductsGrid products={filtered} />
        )}
      </div>
    </main>
  );
}
