// src/app/contact/page.tsx
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import ContactForm from "@/components/public/ContactForm";
import { BUSINESS_INFO } from "@/lib/public-constants";

export const metadata = {
  title: "Contact Us — Click Computer Center",
  description:
    "Get in touch with Click Computer Center in Chagni. Call, WhatsApp, or send us a message.",
};

export default function ContactPage() {
  return (
    <>
      <PublicNav />

      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            📞 Contact Us
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Have a question or need help? We're here for you.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Get in Touch
            </h2>

            {/* Phones */}
            <a
              href={`tel:${BUSINESS_INFO.phone1.replace(/\s/g, "")}`}
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition"
            >
              <div className="text-2xl">📞</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Call Us
                </p>
                <p className="font-semibold text-slate-900 mt-1">
                  {BUSINESS_INFO.phone1}
                </p>
                <p className="text-sm text-slate-600">
                  {BUSINESS_INFO.phone2}
                </p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href={BUSINESS_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition"
            >
              <div className="text-2xl">💬</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  WhatsApp
                </p>
                <p className="font-semibold text-slate-900 mt-1">
                  {BUSINESS_INFO.whatsapp}
                </p>
                <p className="text-sm text-emerald-600">
                  Chat with us now →
                </p>
              </div>
            </a>

            {/* Telegram */}
            <a
              href={BUSINESS_INFO.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="text-2xl">✈️</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Telegram
                </p>
                <p className="font-semibold text-slate-900 mt-1">
                  @rizqmarket1
                </p>
                <p className="text-sm text-blue-600">Join our channel →</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${BUSINESS_INFO.email}`}
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition"
            >
              <div className="text-2xl">📧</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="font-semibold text-slate-900 mt-1 break-all">
                  {BUSINESS_INFO.email}
                </p>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-2xl">📍</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Visit Us
                </p>
                <p className="font-semibold text-slate-900 mt-1">
                  {BUSINESS_INFO.address}
                </p>
                <p className="text-sm text-slate-600">
                  {BUSINESS_INFO.workingHours}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Send a Message
            </h2>
            <ContactForm />
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
