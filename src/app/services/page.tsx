import Link from "next/link";

export default function ServicesMainPage() {
  const services = [
    {
      title: "Hardware Maintenance & Repair",
      desc: "Professional diagnostics, laptop/desktop screen replacements, keyboard repairs, power jack fixes, and motherboard-level troubleshooting.",
      icon: "🔧",
      link: "/services/request",
    },
    {
      title: "Software Installation & OS Setup",
      desc: "Genuine operating system installations (Windows, macOS), drivers setup, antivirus configuration, and essential productivity software.",
      icon: "💻",
      link: "/services/request",
    },
    {
      title: "Computer Training Center",
      desc: "Comprehensive computer training programs covering basic computer skills, advanced graphics design, video editing, and office applications.",
      icon: "🎓",
      link: "/training",
    },
    {
      title: "Networking & CCTV Installation",
      desc: "Home and office network cabling, router/switch configuration, Wi-Fi extension, and professional CCTV security camera setup.",
      icon: "📹",
      link: "/services/request",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Our Professional Services</h1>
        <p className="text-lg text-slate-600">
          At Click Computer Center, we deliver reliable, enterprise-grade technical support, maintenance, and computer training solutions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {services.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-2xl font-bold border border-orange-100">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
            <div>
              <Link
                href={s.link}
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition"
              >
                Get Started ➔
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
