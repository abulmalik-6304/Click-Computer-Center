// src/components/admin/NewCustomerModal.tsx
"use client";

import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
}

export default function NewCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "Regular",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onCreated(data.customer);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">➕ New Customer</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g. Abebe Kebede"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+251 9XX XXX XXX"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Customer Type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            <option>Regular</option>
            <option>VIP</option>
            <option>Wholesale</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="City, kebele…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
