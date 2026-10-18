import Link from "next/link";

const COURSES = [
  { id: "web-dev", title: "Full-Stack Web Development", weeks: 12, fee: 8500, desc: "HTML, CSS, JS, React, Node, databases." },
  { id: "ccna", title: "Networking (CCNA Prep)", weeks: 10, fee: 7000, desc: "Routing, switching, and network security." },
  { id: "office", title: "MS Office & Digital Literacy", weeks: 6, fee: 3500, desc: "Word, Excel, PowerPoint, internet skills." },
  { id: "graphic", title: "Graphic Design Essentials", weeks: 8, fee: 6000, desc: "Photoshop, Illustrator, branding." },
];

export default function TrainingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Computer Training Center</h1>
      <p className="mt-3 text-slate-600 max-w-2xl">
        Industry-aligned programs taught by certified instructors.
      </p>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES.map((c) => (
          <article key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition p-6 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">{c.title}</h2>
            <p className="mt-2 text-slate-600 flex-1">{c.desc}</p>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>{c.weeks} weeks</span>
              <span className="font-semibold text-emerald-700">{c.fee.toLocaleString()} ETB</span>
            </div>
            <Link href={`/training/register?course=${c.id}`}
              className="mt-5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-center transition">
              Register Now
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
