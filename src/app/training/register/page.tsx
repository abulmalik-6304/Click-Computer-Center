// src/app/training/register/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { TRAINING_COURSES } from "@/lib/public-constants";

function RegisterForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    course: params.get("course") || "web-dev",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/training/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setStatus("error");
        return;
      }
      setStatus("ok");
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-slate-900">Registration Received!</h1>
        <p className="mt-4 text-slate-600">
          Thank you, {form.fullName}. We'll contact you at{" "}
          <strong>{form.phone}</strong> within 24 hours to confirm your enrollment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/training"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
          >
            Browse More Courses
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Student Registration
        </h1>
        <p className="text-slate-600 mt-2">
          Fill in your details and we'll be in touch within 24 hours
        </p>
      </div>

      <form
        onSubmit={submit}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <Field
          label="Full Name *"
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
          required
          placeholder="e.g. Abebe Kebede"
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="you@example.com"
        />
        <Field
          label="Phone *"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          required
          placeholder="+251 9XX XXX XXX"
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Course *
          </label>
          <select
            required
            value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {TRAINING_COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {c.fee.toLocaleString()} ETB
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Message (optional)
          </label>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Any questions or preferred schedule?"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Submitting…" : "Register Now"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          By registering you agree to be contacted about this course. No payment
          is required now.
        </p>
      </form>
    </div>
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
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      <p className="mt-4 text-slate-500">Loading registration form…</p>
    </div>
  );
}

export default function TrainingRegisterPage() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50">
        <Suspense fallback={<LoadingFallback />}>
          <RegisterForm />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}
