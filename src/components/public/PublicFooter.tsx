// src/components/public/PublicFooter.tsx
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                C
              </div>
              <p className="font-bold text-white">Click Computer Center</p>
            </div>
            <p className="text-sm">
              Ethiopia's trusted tech partner for computers, training, and repairs.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/store" className="hover:text-orange-400">Store</Link></li>
              <li><Link href="/training" className="hover:text-orange-400">Training</Link></li>
              <li><Link href="/services" className="hover:text-orange-400">Repair</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>📞 +251 900 000 000</li>
              <li>📧 info@clickcomputer.et</li>
              <li>📍 Addis Ababa, Ethiopia</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Hours</h3>
            <ul className="space-y-2 text-sm">
              <li>Mon–Fri: 8:30 AM – 6:00 PM</li>
              <li>Saturday: 9:00 AM – 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>© {new Date().getFullYear()} Click Computer Center. All rights reserved.</p>
          <p className="text-slate-500">Built with ❤️ in Ethiopia</p>
        </div>
      </div>
    </footer>
  );
}
