// src/components/public/DigitalProductsPreview.tsx
import Link from "next/link";
import DigitalProductCard from "./DigitalProductCard";

export default function DigitalProductsPreview({ products }: { products: any[] }) {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-3">
            💎 Digital Products
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Premium Templates & E-Books
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Instant download after payment — no shipping needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <DigitalProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/store/digital"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
          >
            Browse All Digital Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
