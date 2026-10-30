// src/app/page.tsx
import Link from "next/link";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { TRAINING_COURSES, SERVICES } from "@/lib/public-constants";

export default function HomePage() {
  return (
    <>
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold mb-4">
              🇪🇹 Ethiopia's Trusted Tech Hub
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Computers. <br />
              Training. <span className="text-orange-400">Repairs.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-200 max-w-xl">
              From student laptops to enterprise workstations, expert IT training,
              and same-day repairs — Click Computer Center is your one-stop
              technology partner.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/store"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition"
              >
                🛒 Shop Computers
              </Link>
              <Link
                href="/training"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold backdrop-blur transition"
              >
                🎓 Join Training
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <p className="text-3xl font-bold text-orange-400">500+</p>
                <p className="text-xs text-slate-300 mt-1">Happy Customers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-400">6+</p>
                <p className="text-xs text-slate-300 mt-1">Training Programs</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-400">5★</p>
                <p className="text-xs text-slate-300 mt-1">Service Rating</p>
              </div>
            </div>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-800 flex items-center justify-center">
            <span className="text-9xl">💻</span>
          </div>
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg">
            <h3 className="font-bold text-xl">🎁 New Arrivals</h3>
            <p className="opacity-90">Latest Core i7 laptops in stock</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg">
            <h3 className="font-bold text-xl">🔥 Special Offer</h3>
            <p className="opacity-90">Up to 30% off accessories</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
            <h3 className="font-bold text-xl">⚡ Free Diagnostics</h3>
            <p className="opacity-90">Walk-in repair assessments</p>
          </div>
        </div>
      </section>

      {/* QUICK CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            What we offer
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
            Everything you need to buy, learn, or fix your technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/store"
            className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition"
          >
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600">
              Online Store
            </h3>
            <p className="mt-2 text-slate-600 text-sm">
              Computers, accessories, and peripherals from top brands.
            </p>
            <p className="mt-4 text-orange-600 font-semibold text-sm">Browse →</p>
          </Link>

          <Link
            href="/training"
            className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition"
          >
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600">
              Training Center
            </h3>
            <p className="mt-2 text-slate-600 text-sm">
              Full-stack, networking, design — job-ready IT skills.
            </p>
            <p className="mt-4 text-orange-600 font-semibold text-sm">Enroll →</p>
          </Link>

          <Link
            href="/services"
            className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition"
          >
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600">
              Repair Services
            </h3>
            <p className="mt-2 text-slate-600 text-sm">
              Hardware, software, data recovery, and network setup.
            </p>
            <p className="mt-4 text-orange-600 font-semibold text-sm">Request →</p>
          </Link>
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                🎓 Featured Courses
              </h2>
              <p className="text-slate-600 mt-2">
                Learn in-demand tech skills with hands-on projects
              </p>
            </div>
            <Link href="/training" className="text-orange-600 font-semibold hover:text-orange-700">
              View all →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRAINING_COURSES.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col"
              >
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-600 mt-2 flex-1">{c.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">⏱ {c.duration}</span>
                  <span className="font-bold text-emerald-600">
                    {c.fee.toLocaleString()} ETB
                  </span>
                </div>
                <Link
                  href={`/training/register?course=${c.id}`}
                  className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-center text-sm"
                >
                  Enroll Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES OVERVIEW */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                🔧 Our Services
              </h2>
              <p className="text-slate-600 mt-2">
                Fast, reliable repairs backed by certified technicians
              </p>
            </div>
            <Link href="/services" className="text-orange-600 font-semibold hover:text-orange-700">
              All services →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{s.description}</p>
                <p className="mt-3 text-sm font-semibold text-emerald-600">
                  From {s.startingPrice.toLocaleString()} ETB
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to upgrade your tech?
          </h2>
          <p className="mt-4 text-orange-100 max-w-2xl mx-auto">
            Whether you need a new laptop, want to learn coding, or fix a broken
            computer — we're here to help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/store"
              className="px-6 py-3 bg-white text-orange-700 hover:bg-orange-50 rounded-lg font-bold"
            >
              Shop Now
            </Link>
            <Link
              href="/services/request"
              className="px-6 py-3 bg-orange-900/40 hover:bg-orange-900/60 text-white rounded-lg font-bold backdrop-blur"
            >
              Book a Repair
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
