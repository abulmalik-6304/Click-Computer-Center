// src/components/public/Hero.tsx
"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <div className="relative">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm mb-5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-emerald-300">
          {t("hero.badge")}
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
        <span className="bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
          {t("hero.title1")}
        </span>
        <br />
        <span className="text-slate-300 text-xl sm:text-2xl lg:text-3xl font-medium">
          {t("hero.title2")}
        </span>
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg text-slate-300 mb-6 max-w-xl">
        {t("hero.desc")}
      </p>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/store/digital"
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition text-sm"
        >
          {t("hero.cta1")}
        </Link>
        <Link
          href="/store"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 transition text-sm"
        >
          {t("hero.cta2")}
        </Link>
      </div>

      {/* Trust signals */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span>{t("hero.trust1")}</span>
        <span>{t("hero.trust2")}</span>
        <span>{t("hero.trust3")}</span>
      </div>
    </div>
  );
}
