// src/app/admin/suppliers/SuppliersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Supplier } from "./page";

type ModalMode = "create" | "edit" | null;

export default function SuppliersClient({
  initialSuppliers,
}: {
  initialSuppliers: Supplier[];
}) {
  const [items, setItems] = useState(initialSuppliers);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    if (!q) return items;
    const lq = q.toLowerCase();
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(lq) ||
        s.company.toLowerCase().includes(lq) ||
        s.phone.toLowerCase().includes(lq) ||
        s.supplyItem.toLowerCase().includes(lq)
    );
  }, [items, q]);

  async function refresh() {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (Array.isArray(data.suppliers)) setItems(data.suppliers);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🏭 Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} registered suppliers</p>
        </div>
        <button
          onClick={() => { setActive(null); setModal("create"); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition"
        >
          + Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, company, phone, item…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🏭</p>
          <p className="text-slate-500">No suppliers yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl flex-shrink-0">
                  🏭
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{s.name}</p>
                  <p className="text-sm text-slate-500 truncate">{s.company || "—"}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.id}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-sm">
                {s.phone && (
                  <p className="text-slate-700">
                    <span className="text-slate-500">📞</span> {s.phone}
                  </p>
                )}
                {s.supplyItem && (
                  <p className="text-slate-700">
                    <span className="text-slate-500">📦</span> {s.supplyItem}
                  </p>
                )}
                {s.address && (
                  <p className="text-slate-700">
                    <span className="text-slate-500">📍</span> {s.address}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setActive(s); setModal("edit"); }}
                  className="py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${s.name}"?`)) return;
                    await fetch("/api/suppliers", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: s.id }),
                    });
                    refresh();
                  }}
                  className="py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "create" && (
        <SupplierForm
          title="Add Supplier"
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal === "edit" && active && (
        <SupplierForm
          title={`Edit: ${active.name}`}
          existing={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
    </div>
  );
}

function SupplierForm({
  title, existing, onClose, onSaved,
}: { title: string; existing?: Supplier; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    phone: existing?.phone ?? "",
    company: existing?.company ?? "",
    supplyItem: existing?.supplyItem ?? "",
    address: existing?.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = existing ? "PUT" : "POST";
      const body = existing ? { id: existing.id, ...form } : form;
      const res = await fetch("/api/suppliers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>

        <Field label="Supplier Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Supply Item(s)" value={form.supplyItem} onChange={(v) => setForm({ ...form, supplyItem: v })} placeholder="e.g. Laptops, Monitors" />
        <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50">
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}
