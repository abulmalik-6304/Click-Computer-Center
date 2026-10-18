import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold mb-4">
            Ethiopia's Trusted Tech Hub
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Computers. Training.{" "}
            <span className="text-orange-400">Repairs.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-200 max-w-xl">
            ከተማሪ ላፕቶፕ እስከ ኢንተርፕራይዝ ዌርክስቴሽን፣ የባለሙያ አይቲ ስልጠና እና በዚያው ቀን የሚሰሩ ጥገናዎች —
            Click Computer Center የእርስዎ የቴክኖሎጂ አጋር ነው።
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/store" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition">
              Shop Computers
            </Link>
            <Link href="/training" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold backdrop-blur transition">
              Join Training
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg">
            <h3 className="font-bold text-xl">New Arrivals</h3>
            <p className="opacity-90">Latest Core i7 laptops</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg">
            <h3 className="font-bold text-xl">Accessories Sale</h3>
            <p className="opacity-90">Up to 30% off</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
            <h3 className="font-bold text-xl">Free Diagnostics</h3>
            <p className="opacity-90">Walk-in repairs</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">🎓 Training Center</h2>
            <p className="mt-3 text-slate-600">
              Full-Stack Web Dev, Networking, MS Office, Graphic Design.
            </p>
            <Link href="/training" className="inline-block mt-4 text-orange-600 font-semibold hover:underline">
              View Courses →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">🔧 Repair Services</h2>
            <p className="mt-3 text-slate-600">
              Hardware, software, data recovery, network setup.
            </p>
            <Link href="/services" className="inline-block mt-4 text-orange-600 font-semibold hover:underline">
              See Services →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">🛒 Online Store</h2>
            <p className="mt-3 text-slate-600">
              Computers, accessories, and peripherals.
            </p>
            <Link href="/store" className="inline-block mt-4 text-orange-600 font-semibold hover:underline">
              Shop Now →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
