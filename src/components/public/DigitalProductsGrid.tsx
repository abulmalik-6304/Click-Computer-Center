// src/components/public/DigitalProductsGrid.tsx
"use client";

import { useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { useLanguage } from "./LanguageProvider";
import DigitalProductDetailModal from "./DigitalProductDetailModal";
import {
  getDigitalCategoryIcon,
  getDigitalCategoryLabel,
  formatFileSize,
} from "@/lib/digital-product-types";

export default function DigitalProductsGrid({ products }: { products: any[] }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<any>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelected(product)}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition group text-left flex flex-col"
          >
            {/* Full image — ሙሉ ሆኖ */}
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              {product.thumbnailImage ? (
                <img
                  src={formatDriveUrl(product.thumbnailImage)}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src = "/placeholder.svg")
                  }
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-emerald-50 to-slate-100">
                  {getDigitalCategoryIcon(product.category)}
                </div>
              )}
              {product.featured && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold shadow">
                  {t("product.featured")}
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                  👁 {t("digital.preview")}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                {getDigitalCategoryIcon(product.category)}{" "}
                {getDigitalCategoryLabel(product.category)}
              </p>
              <h3 className="font-bold text-slate-900 mt-1 line-clamp-2">
                {product.title}
              </h3>
              {product.description && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">
                  {product.description}
                </p>
              )}

              {product.fileSize > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  📎 {formatFileSize(product.fileSize)}{" "}
                  {product.fileType?.toUpperCase()}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xl font-bold text-emerald-600">
                  {Number(product.price).toLocaleString()}{" "}
                  <span className="text-sm text-slate-400">ETB</span>
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <DigitalProductDetailModal
          product={selected}
          allProducts={products}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
