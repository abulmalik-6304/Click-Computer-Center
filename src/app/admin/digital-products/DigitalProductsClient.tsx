// src/app/admin/digital-products/DigitalProductsClient.tsx
"use client";

import { useState } from "react";
import { formatFileSize, getDigitalCategoryLabel, getDigitalCategoryIcon } from "@/lib/digital-product-types";
import DigitalProductForm from "@/components/admin/digital-products/DigitalProductForm";

export default function DigitalProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/digital-products", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.products)) setProducts(data.products);
    } catch {}
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            💎 Digital Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} products · Sell E-books, Templates, Software
          </p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm text-sm"
        >
          + Upload Product
        </button>
      </div>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">💎</p>
          <p className="text-slate-500">No digital products yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg">
            Upload your first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {p.thumbnailImage ? (
                  <img src={p.thumbnailImage} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">{getDigitalCategoryIcon(p.category)}</div>
                )}
                {p.featured && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">⭐ Featured</span>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 line-clamp-2">{p.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">{getDigitalCategoryIcon(p.category)} {getDigitalCategoryLabel(p.category)}</p>
                <p className="text-lg font-bold text-emerald-600 mt-2">{Number(p.price).toLocaleString()} <span className="text-xs text-slate-400">ETB</span></p>
                {p.fileSize > 0 && <p className="text-xs text-slate-400 mt-1">📎 {formatFileSize(p.fileSize)}</p>}

                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="flex-1 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg">✏️ Edit</button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Archive "${p.title}"?`)) return;
                      await fetch("/api/admin/digital-products", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: p.id, deleteFile: false }),
                      });
                      refresh();
                    }}
                    className="flex-1 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg"
                  >
                    🗑 Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <DigitalProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={() => { setShowForm(false); setEditProduct(null); refresh(); }}
        />
      )}
    </div>
  );
}
