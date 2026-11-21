// src/components/public/PublicFooter.tsx
import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/public-constants";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <div>
                <p className="font-bold text-white">{BUSINESS_INFO.name}</p>
                <p className="text-xs text-slate-400">{BUSINESS_INFO.tagline}</p>
              </div>
            </div>
            <p className="text-sm mt-3">{BUSINESS_INFO.description}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/store" className="hover:text-emerald-400">
                  Store
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-emerald-400">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-emerald-400">
                  Training
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>📞 {BUSINESS_INFO.phone1}</li>
              <li>📞 {BUSINESS_INFO.phone2}</li>
              <li>📧 {BUSINESS_INFO.email}</li>
              <li>📍 {BUSINESS_INFO.address}</li>
              <li>🕐 {BUSINESS_INFO.workingHours}</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-white mb-3">Follow Us</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={BUSINESS_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition"
              >
                💬 WhatsApp
              </a>
              <a
                href={BUSINESS_INFO.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
              >
                ✈️ Telegram
              </a>
            </div>

            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Payment Methods</p>
              <ul className="text-xs space-y-0.5">
                <li>Telebirr: {BUSINESS_INFO.payment.telebirr}</li>
                <li>CBE: {BUSINESS_INFO.payment.cbe}</li>
                <li>Dashen: {BUSINESS_INFO.payment.dashen}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>
            © {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights
            reserved.
          </p>
          <p className="text-slate-500">
            Built with ❤️ in {BUSINESS_INFO.country}
          </p>
        </div>
      </div>
    </footer>
  );
}
