// src/components/public/DigitalProductDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { useLanguage } from "./LanguageProvider";
import DigitalCheckoutModal from "./DigitalCheckoutModal";
import {
  getDigitalCategoryIcon,
  getDigitalCategoryLabel,
  formatFileSize,
} from "@/lib/digital-product-types";

export default function DigitalProductDetailModal({
  product,
  allProducts,
  onClose,
}: {
  product: any;
  allProducts: any[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [showCheckout, setShowCheckout] = useState(false);

  // Body scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Similar products
  const similar = allProducts
    .filter(
      (p) => p.id !== product.id && p.category === product.category
    )
    .slice(0, 3);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 rounded-t-2xl flex items-center justify-between z-10">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {product.title}
              </h2>
              <p className="text-xs text-slate-500">
                {getDigitalCategoryIcon(product.category)}{" "}
                {getDigitalCategoryLabel(product.category)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xl flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="p-5 grid lg:grid-cols-2 gap-6">
            {/* Left: Full image */}
            <div>
              <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-3">
                {product.thumbnailImage ? (
                  <img
                    src={formatDriveUrl(product.thumbnailImage)}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    {getDigitalCategoryIcon(product.category)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="space-y-4">
              {/* Price */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-700 uppercase tracking-wide">
                  {t("product.price")}
                </p>
                <p className="text-4xl font-bold text-emerald-700 mt-1">
                  {Number(product.price).toLocaleString()}
                  <span className="text-base text-slate-500 ml-1">ETB</span>
                </p>
              </div>

              {/* File info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">
                    {t("product.fileType")}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {product.fileType?.toUpperCase() || "—"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">
                    {t("product.fileSize")}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatFileSize(product.fileSize)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    {t("product.description")}
                  </h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Buy button */}
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transition"
              >
                💳 {t("digital.buy")}
              </button>

              <p className="text-xs text-slate-500 text-center">
                🔒 Secure payment · 💬 WhatsApp support
              </p>
            </div>
          </div>

          {/* Similar products */}
          {similar.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                {t("digital.similar")}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {similar.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition cursor-pointer"
                    onClick={() => {
                      // Replace current modal with similar product
                      onClose();
                      setTimeout(() => {
                        // Trigger parent to open new modal
                        window.dispatchEvent(
                          new CustomEvent("openDigitalProduct", { detail: s })
                        );
                      }, 100);
                    }}
                  >
                    <div className="aspect-video bg-slate-100">
                      {s.thumbnailImage ? (
                        <img
                          src={formatDriveUrl(s.thumbnailImage)}
                          alt={s.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {getDigitalCategoryIcon(s.category)}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {s.title}
                      </p>
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        {Number(s.price).toLocaleString()} ETB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <DigitalCheckoutModal
          product={product}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
