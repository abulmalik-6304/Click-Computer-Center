// src/components/public/Hero.tsx
"use client";

import Link from "next/link";
import { BUSINESS_INFO, HOMEPAGE_STATS } from "@/lib/public-constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-300">
              {BUSINESS_INFO.city}, {BUSINESS_INFO.country}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
              {BUSINESS_INFO.name}
            </span>
            <br />
            <span className="text-slate-300 text-2xl sm:text-3xl lg:text-4xl font-medium">
              {BUSINESS_INFO.tagline}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl">
            Premium computers, professional repairs, expert training, and
            reliable tech services — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/store"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition"
            >
              🛒 Browse Store
            </Link>
            <Link
              href="/services"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 transition"
            >
              🔧 Our Services
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition"
            >
              📞 Contact Us
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
            {HOMEPAGE_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
