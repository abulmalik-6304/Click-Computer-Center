"use client";
import { useState } from "react";

export default function ServiceRequestPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/services/request", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd)),
      headers: { "Content-Type": "application/json" },
    });
    setStatus(res.ok ? "ok" : "error");
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Request a Repair</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Full Name</label>
          <input required name="fullName" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Phone</label>
          <input required name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Device Model</label>
          <input required name="device" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Describe the problem</label>
          <textarea required name="issue" rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900" />
        </div>
        <button disabled={status === "loading"}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50">
          {status === "loading" ? "Submitting…" : "Submit Request"}
        </button>
        {status === "ok" && <p className="text-emerald-700 font-medium">✅ Request received.</p>}
        {status === "error" && <p className="text-red-600 font-medium">Something went wrong.</p>}
      </form>
    </div>
  );
}
