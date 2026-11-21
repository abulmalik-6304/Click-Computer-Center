// src/components/public/ProductCard.tsx
"use client";

import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { BUSINESS_INFO } from "@/lib/public-constants";

interface WebProduct {
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

function fmt(n: number): string {
  return Number(n || 0).toLocaleString();
}

export default function ProductCard({ product }: { product: WebProduct }) {
  const orderText = encodeURIComponent(
    `Hi! I want to order: ${product.name} (${fmt(product.price)} ETB)`
  );
  const whatsappUrl = `${BUSINESS_INFO.whatsappUrl}?text=${orderText}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition flex flex-col group">
      {/* Image */}
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        <img
          src={formatDriveUrl(product.image)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) =>
            ((e.target as HTMLImageElement).src = "/placeholder.svg")
          }
        />
        {product.featured && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
            ⭐ Featured
          </span>
        )}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-semibold">
          {product.stock} in stock
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-xs text-slate-500 uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="font-bold text-slate-900 mt-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-xl font-bold text-emerald-600">
            {fmt(product.price)}
            <span className="text-sm text-slate-400 ml-1">ETB</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg text-center transition"
          >
            💬 Order Now
          </a>
          <a
            href={`tel:${BUSINESS_INFO.phone1.replace(/\s/g, "")}`}
            className="py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg text-center transition"
          >
            📞 Call
          </a>
        </div>
      </div>
    </div>
  );
}
