// src/components/public/ContactForm.tsx
"use client";

import { useState } from "react";
import { BUSINESS_INFO } from "@/lib/public-constants";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        setStatus("error");
        return;
      }

      setStatus("ok");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
        <div className="text-5xl">✅</div>
        <h3 className="text-xl font-bold text-emerald-900">
          Message Sent!
        </h3>
        <p className="text-sm text-emerald-700">
          Thank you for contacting us. We'll get back to you soon.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <a
            href={BUSINESS_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
          >
            💬 WhatsApp
          </a>
          <button
            onClick={() => setStatus("idle")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg"
          >
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label="Full Name *"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
          placeholder="e.g. Abebe Kebede"
        />
        <Field
          label="Phone *"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          required
          placeholder="+251 9XX XXX XXX"
        />
      </div>

      <Field
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="you@example.com"
      />

      <Field
        label="Subject *"
        value={form.subject}
        onChange={(v) => setForm({ ...form, subject: v })}
        required
        placeholder="What is this about?"
      />

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          Message *
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          rows={5}
          placeholder="Write your message here…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50 transition"
      >
        {status === "loading" ? "Sending…" : "📤 Send Message"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}
