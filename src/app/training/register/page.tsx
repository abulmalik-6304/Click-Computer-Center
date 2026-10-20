"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function RegisterForm() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/training/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd)),
      headers: { "Content-Type": "application/json" },
    });
    setStatus(res.ok ? "ok" : "error");
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">Full Name</label>
        <input required name="fullName" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
        <input required name="email" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">Phone</label>
        <input required name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">Course</label>
        <select 
          name="course" 
          defaultValue={params.get("course") ?? "web-dev"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
        >
          <option value="web-dev">Full-Stack Web Development</option>
          <option value="ccna">Networking (CCNA Prep)</option>
          <option value="office">MS Office & Digital Literacy</option>
          <option value="graphic">Graphic Design Essentials</option>
        </select>
      </div>
      <button 
        disabled={status === "loading"}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
      >
        {status === "loading" ? "Submitting…" : "Submit Registration"}
      </button>
      {status === "ok" && <p className="text-emerald-700 font-medium text-sm">✅ Registration received successfully!</p>}
      {status === "error" && <p className="text-red-600 font-medium text-sm">Something went wrong. Please try again.</p>}
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Student Registration</h1>
      <p className="text-slate-500 text-sm mt-1">Fill out the form below to enroll in our training programs.</p>
      <Suspense fallback={<div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200">Loading form...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
