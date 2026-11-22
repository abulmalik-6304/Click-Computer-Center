// src/components/public/DigitalProductCard.tsx
"use client";

import { useState } from "react";
import DigitalCheckoutModal from "./DigitalCheckoutModal";
import {
  getDigitalCategoryLabel,
  getDigitalCategoryIcon,
  formatFileSize,
} from "@/lib/digital-product-types";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

export default function DigitalProductCard({ product }: { product: any }) {
  const [showCheckout, setShowCheckout] = useState(false);

  const fileMetaParts = [
    product.fileSize > 0 ? formatFileSize(product.fileSize) : "",
    product.fileType ? String(product.fileType).toUpperCase() : "",
  ].filter(Boolean);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition flex flex-col group">
        {/* Thumbnail / File Preview */}
        <div className="relative aspect-video bg-slate-100 overflow-hidden">
          {product.thumbnailImage ? (
            <img
              src={formatDriveUrl(product.thumbnailImage)}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {getDigitalCategoryIcon(product.category)}
            </div>
          )}

          {product.featured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
              ⭐ Featured
            </span>
          )}
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-semibold">
            💎 Digital
          </span>
        </div>

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

          {fileMetaParts.length > 0 && (
            <p className="text-xs text-slate-500 mt-2 font-medium">
              📎 {fileMetaParts.join(" · ")}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xl font-bold text-emerald-600">
              {Number(product.price).toLocaleString()}{" "}
              <span className="text-sm text-slate-400">ETB</span>
            </p>
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition text-sm"
            >
              💳 Buy & Download
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <DigitalCheckoutModal
          product={product}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
