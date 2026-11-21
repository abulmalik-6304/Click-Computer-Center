// src/components/public/ProductsPreview.tsx
import Link from "next/link";
import ProductCard from "./ProductCard";

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

export default function ProductsPreview({
  products,
}: {
  products: WebProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            ⭐ Featured Products
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Our top picks — quality guaranteed.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
          >
            Browse All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
