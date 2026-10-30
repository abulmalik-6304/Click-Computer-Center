// src/app/training/page.tsx
import Link from "next/link";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { TRAINING_COURSES } from "@/lib/public-data";

export default function TrainingPage() {
  return (
    <>
      <PublicNav />

      <section className="bg-gradient-to-br from-slate-900 to-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold mb-3">
            🎓 Training Center
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Build a career in tech
          </h1>
          <p className="mt-4 text-lg text-slate-200 max-w-2xl">
            Industry-aligned programs taught by certified instructors. Small
            classes, hands-on labs, and job-ready portfolios.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_COURSES.map((c) => (
            <article
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition p-6 flex flex-col"
            >
              <div className="text-5xl mb-4">{c.icon}</div>
              <h2 className="text-xl font-bold text-slate-900">{c.title}</h2>
              <p className="mt-2 text-slate-600 text-sm flex-1">{c.description}</p>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>⏱ Duration: <span className="font-semibold text-slate-900">{c.duration}</span></p>
                <p>📊 Level: <span className="font-semibold text-slate-900">{c.level}</span></p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {c.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">
                  {c.fee.toLocaleString()}
                  <span className="text-sm text-slate-400 ml-1">ETB</span>
                </span>
                <Link
                  href={`/training/register?course=${c.id}`}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm"
                >
                  Enroll →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
