// src/components/public/PhysicalProductsPreview.tsx
import Link from "next/link";
import ProductCard from "./ProductCard";
import { BUSINESS_INFO } from "@/lib/public-constants";

export default function PhysicalProductsPreview({ products }: { products: any[] }) {
  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-3">
            🛒 Physical Store
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            In-Store Products
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Visit us or order online — pick up in {BUSINESS_INFO.city}.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition"
          >
            Browse Full Store →
          </Link>
        </div>
      </div>
    </section>
  );
}
