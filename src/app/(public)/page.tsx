import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold mb-4">
              Ethiopia's Trusted Tech Hub
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Computers. Training. <span className="text-orange-400">Repairs.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-200 max-w-xl">
              From student laptops to enterprise workstations, expert IT
              training, and same-day repairs — Click Computer Center is your
              one-stop technology partner.
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
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            {/* Replace with real hero image */}
            <img
              src="https://lh3.googleusercontent.com/d/YOUR_HERO_IMAGE_ID=w1200"
              alt="Computer showcase"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'New Arrivals', desc: 'Latest Core i7 laptops', color: 'from-emerald-500 to-emerald-700' },
            { title: 'Accessories Sale', desc: 'Up to 30% off', color: 'from-orange-500 to-orange-700' },
            { title: 'Free Diagnostics', desc: 'Walk-in repairs', color: 'from-slate-700 to-slate-900' },
          ].map((b) => (
            <div key={b.title} className={`p-6 rounded-2xl bg-gradient-to-br ${b.color} text-white shadow-lg`}>
              <h3 className="font-bold text-xl">{b.title}</h3>
              <p className="opacity-90">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
