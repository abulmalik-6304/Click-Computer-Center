// src/app/about/page.tsx
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { BUSINESS_INFO, SERVICES, TRAINING_COURSES } from "@/lib/public-constants";
import Link from "next/link";

export const metadata = {
  title: "About Us — Click Computer Center",
};

const VALUES = [
  { icon: "✅", title: "Quality First", description: "We stock only genuine products and use original parts for every repair." },
  { icon: "⚡", title: "Fast Service", description: "Most repairs are completed same-day. Your time is valuable." },
  { icon: "🤝", title: "Trust & Honesty", description: "Transparent pricing, clear communication, and honest advice — always." },
  { icon: "🎓", title: "Empowering People", description: "We train the next generation of tech professionals through our training center." },
];

const MILESTONES = [
  { year: "2019", event: "Business founded in Chagni" },
  { year: "2021", event: "Training center launched" },
  { year: "2023", event: "1,000+ devices repaired" },
  { year: "2024", event: "300+ students trained" },
  { year: "2025", event: "Online store launched" },
];

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Your trusted tech partner in {BUSINESS_INFO.city}, Ethiopia.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">📖 Our Story</h2>
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            <strong>{BUSINESS_INFO.name}</strong> started with a simple mission:
            to make quality technology accessible to everyone in{" "}
            {BUSINESS_INFO.city}. What began as a small repair shop has grown
            into a full-service tech center.
          </p>
          <p>Today, we offer:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Retail store</strong> — computers, laptops, printers, and accessories</li>
            <li><strong>Repair services</strong> — hardware, software, and data recovery</li>
            <li><strong>Training center</strong> — web development, networking, graphic design, and more</li>
            <li><strong>Digital products</strong> — templates, e-books, and design files</li>
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">💎 Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">🗓 Our Journey</h2>
        <div className="space-y-4">
          {MILESTONES.map((m) => (
            <div key={m.year} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                {m.year}
              </div>
              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 mt-2">
                <p className="text-slate-900">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services — hidden section, reached via #services */}
      <section id="services" className="bg-slate-50 py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">🔧 Our Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-lg text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{s.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.features.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                      ✓ {f}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    From <strong className="text-emerald-600">{s.startingPrice.toLocaleString()} ETB</strong>
                  </span>
                  <Link href="/services/request" className="text-xs font-semibold text-orange-600">
                    Request →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training — hidden section, reached via #training */}
      <section id="training" className="py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">🎓 Training Courses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRAINING_COURSES.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="text-5xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-lg text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{c.description}</p>
                <div className="mt-3 text-xs text-slate-500">
                  <p>⏱ <strong>{c.duration}</strong> · 📊 {c.level}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-600">
                    {c.fee.toLocaleString()}<span className="text-xs text-slate-400 ml-1">ETB</span>
                  </span>
                  <Link href={`/training/register?course=${c.id}`} className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg">
                    Enroll →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
          <p className="text-lg text-emerald-100 mb-8">
            Visit us in {BUSINESS_INFO.address}, or reach out today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={BUSINESS_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-slate-100">
              💬 WhatsApp
            </a>
            <Link href="/contact" className="px-6 py-3 bg-emerald-900/50 backdrop-blur text-white font-semibold rounded-xl border border-white/20">
              📞 Contact Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
