// src/components/public/ServicesPreview.tsx
import Link from "next/link";
import { SERVICES } from "@/lib/public-constants";

export default function ServicesPreview() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Professional Services
        </h2>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          From hardware repairs to network setup — we've got you covered.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition flex flex-col"
          >
            <div className="text-4xl mb-3">{service.icon}</div>
            <h3 className="font-bold text-lg text-slate-900">
              {service.title}
            </h3>
            <p className="text-sm text-slate-600 mt-2 flex-1">
              {service.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-1">
              {service.features.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                >
                  ✓ {f}
                </span>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                From{" "}
                <strong className="text-emerald-600">
                  {service.startingPrice.toLocaleString()} ETB
                </strong>
              </span>
              <Link
                href="/services"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Details →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/services"
          className="inline-block px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
        >
          View All Services →
        </Link>
      </div>
    </section>
  );
}
