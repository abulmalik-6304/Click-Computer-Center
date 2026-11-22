// src/components/public/ProductSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { BUSINESS_INFO } from "@/lib/public-constants";

interface Product {
  id: string;
  itemId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
}

export default function ProductSidebar({ products }: { products: Product[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Animate cards — rotate every 4 seconds
  useEffect(() => {
    if (products.length <= 1 || paused) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length, paused]);

  if (products.length === 0) return null;

  const visible = [
    products[currentIndex % products.length],
    products[(currentIndex + 1) % products.length],
    products[(currentIndex + 2) % products.length],
  ].filter(Boolean);

  return (
    <div
      className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          📢 In-Store Products
        </h2>
        <Link
          href="/store"
          className="text-xs text-emerald-300 hover:text-emerald-200"
        >
          View all →
        </Link>
      </div>

      {/* Product cards */}
      <div className="space-y-2">
        {visible.map((p, idx) => (
          <div
            key={`${p.id}-${idx}`}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/10 hover:bg-white/20 transition-all duration-500 cursor-pointer group"
            style={{
              animation: `fadeIn 0.5s ease-in-out ${idx * 0.1}s both`,
            }}
          >
            <div className="flex items-center gap-2">
              <img
                src={formatDriveUrl(p.image)}
                alt={p.name}
                className="w-12 h-12 rounded-lg object-cover bg-white/20 flex-shrink-0"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/placeholder.svg")
                }
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {p.name}
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  {p.category}
                </p>
                <p className="text-xs font-bold text-emerald-300">
                  {p.price.toLocaleString()} ETB
                </p>
              </div>
              <a
                href={`${BUSINESS_INFO.whatsappUrl}?text=${encodeURIComponent(
                  `Hi! I want to order: ${p.name} (${p.price} ETB)`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded flex-shrink-0"
              >
                Order
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {products.slice(0, Math.min(products.length, 8)).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentIndex % products.length
                  ? "w-4 bg-emerald-400"
                  : "w-1 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href="/store"
        className="block mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg text-center transition"
      >
        🛒 Visit Store
      </Link>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
