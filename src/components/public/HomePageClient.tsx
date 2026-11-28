// src/components/public/HomePageClient.tsx
"use client";

import Hero from "./Hero";
import CoursesSection from "./CoursesSection";
import DigitalProductsGrid from "./DigitalProductsGrid";
import ProductCard from "./ProductCard";
import { useLanguage } from "./LanguageProvider";
import { HOMEPAGE_STATS, BUSINESS_INFO } from "@/lib/public-constants";
import Link from "next/link";

export default function HomePageClient({
  digital,
  physical,
}: {
  digital: any[];
  physical: any[];
}) {
  const { t } = useLanguage();

  return (
    <>
      {/* ═══ Hero ═══ */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <Hero />
        </div>
      </section>

      {/* ═══ Courses ═══ */}
      <CoursesSection />

      {/* ═══ Digital Products ═══ */}
      {digital.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-3">
                💎 Digital
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {t("digital.title")}
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
                {t("digital.subtitle")}
              </p>
            </div>
            <DigitalProductsGrid products={digital} />
            <div className="text-center mt-10">
              <Link
                href="/store/digital"
                className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
              >
                {t("common.viewAll")} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Physical Products ═══ */}
      {physical.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-3">
                🛒 Store
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                In-Store Products
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {physical.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/store"
                className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition"
              >
                {t("common.viewAll")} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Stats ═══ */}
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

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-lg text-emerald-100 mb-8">{t("cta.subtitle")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={BUSINESS_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              {t("cta.whatsapp")}
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
              {t("cta.contact")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
