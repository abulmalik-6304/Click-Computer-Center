// src/app/page.tsx — የተዋሃደ ምርጥ ስሪት
import { LanguageProvider } from "@/components/public/LanguageProvider";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import Hero from "@/components/public/Hero";
import DigitalProductsPreview from "@/components/public/DigitalProductsPreview";
import PhysicalProductsPreview from "@/components/public/PhysicalProductsPreview";
import ProductSidebar from "@/components/public/ProductSidebar";
import Link from "next/link";
import { BUSINESS_INFO, HOMEPAGE_STATS } from "@/lib/public-constants";

export const revalidate = 60;

async function getFeaturedDigital() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/public/digital-products?limit=6&featured=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

async function getFeaturedPhysical() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/public/products?limit=6&featured=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

async function getSidebarProducts() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/public/products?limit=20`,
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
  const [digital, physical, sidebarProducts] = await Promise.all([
    getFeaturedDigital(),
    getFeaturedPhysical(),
    getSidebarProducts(),
  ]);

  return (
    <LanguageProvider>
      <PublicNav />

      {/* HERO + SIDEBAR */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Hero />
            </div>
            <div className="lg:col-span-1">
              <ProductSidebar products={sidebarProducts} />
            </div>
          </div>
        </div>
      </section>

      {/* DIGITAL PRODUCTS */}
      {digital.length > 0 && (
        <DigitalProductsPreview products={digital} />
      )}

      {/* PHYSICAL PRODUCTS */}
      {physical.length > 0 && (
        <PhysicalProductsPreview products={physical} />
      )}

      {/* STATS */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {HOMEPAGE_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-emerald-600">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
    </LanguageProvider>
  );
}
