// src/app/page.tsx
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import Hero from "@/components/public/Hero";
import ServicesPreview from "@/components/public/ServicesPreview";
import ProductsPreview from "@/components/public/ProductsPreview";
import TrainingPreview from "@/components/public/TrainingPreview";
import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/public-constants";

export const revalidate = 60;

// ✅ Server-side: fetch featured products
async function getFeaturedProducts() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/public/products?featured=true&limit=8`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      <PublicNav />

      <Hero />

      {featuredProducts.length > 0 && (
        <ProductsPreview products={featuredProducts} />
      )}

      <ServicesPreview />

      <TrainingPreview />

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Visit us in {BUSINESS_INFO.city} or call us today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={BUSINESS_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              💬 WhatsApp Us
            </a>
            <a
              href={`tel:${BUSINESS_INFO.phone1.replace(/\s/g, "")}`}
              className="px-6 py-3 bg-emerald-900/50 backdrop-blur text-white font-semibold rounded-xl border border-white/20 hover:bg-emerald-900/70 transition"
            >
              📞 {BUSINESS_INFO.phone1}
            </a>
            <Link
              href="/contact"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition"
            >
              Contact Form →
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
