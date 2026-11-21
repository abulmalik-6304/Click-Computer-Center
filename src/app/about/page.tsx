// src/app/about/page.tsx
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { BUSINESS_INFO } from "@/lib/public-constants";
import Link from "next/link";

export const metadata = {
  title: "About Us — Click Computer Center",
  description:
    "Learn about Click Computer Center — your trusted tech partner in Chagni, Ethiopia.",
};

const VALUES = [
  {
    icon: "✅",
    title: "Quality First",
    description:
      "We stock only genuine products and use original parts for every repair.",
  },
  {
    icon: "⚡",
    title: "Fast Service",
    description:
      "Most repairs are completed same-day. Your time is valuable.",
  },
  {
    icon: "🤝",
    title: "Trust & Honesty",
    description:
      "Transparent pricing, clear communication, and honest advice — always.",
  },
  {
    icon: "🎓",
    title: "Empowering People",
    description:
      "We train the next generation of tech professionals through our training center.",
  },
];

const MILESTONES = [
  { year: "2019", event: "Business founded in Chagni" },
  { year: "2021", event: "Training center launched" },
  { year: "2023", event: "1,000+ devices repaired" },
  { year: "2024", event: "300+ students trained" },
  { year: "2025", event: "Online store launched" },
];

const TEAM = [
  {
    name: "Owner & Founder",
    role: "Lead Technician",
    icon: "👨‍💼",
  },
  {
    name: "Manager",
    role: "Operations & Training",
    icon: "👨‍💼",
  },
  {
    name: "Staff Team",
    role: "Repairs & Sales",
    icon: "👥",
  },
];

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            About Us
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Your trusted tech partner in {BUSINESS_INFO.city}, Ethiopia.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          📖 Our Story
        </h2>
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            <strong>{BUSINESS_INFO.name}</strong> started with a simple
            mission: to make quality technology accessible to everyone in{" "}
            {BUSINESS_INFO.city}. What began as a small repair shop has grown
            into a full-service tech center.
          </p>
          <p>
            Today, we offer:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Retail store</strong> — computers, laptops, printers, and
              accessories
            </li>
            <li>
              <strong>Repair services</strong> — hardware, software, and data
              recovery
            </li>
            <li>
              <strong>Training center</strong> — web development, networking,
              graphic design, and more
            </li>
            <li>
              <strong>IT services</strong> — network setup, CCTV, and
              maintenance
            </li>
          </ul>
          <p>
            We're proud to serve hundreds of happy customers and to be a
            training hub for the next generation of tech professionals in
            Ethiopia.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            💎 Our Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition"
              >
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
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          🗓 Our Journey
        </h2>
        <div className="space-y-4">
          {MILESTONES.map((m, i) => (
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

      {/* Team */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            👥 Our Team
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {TEAM.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-6 text-center"
              >
                <div className="text-5xl mb-3">{t.icon}</div>
                <h3 className="font-bold text-slate-900">{t.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Work With Us?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Visit us in {BUSINESS_INFO.address}, or reach out today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={BUSINESS_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              💬 WhatsApp
            </a>
            <Link
              href="/contact"
              className="px-6 py-3 bg-emerald-900/50 backdrop-blur text-white font-semibold rounded-xl border border-white/20 hover:bg-emerald-900/70 transition"
            >
              📞 Contact Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
