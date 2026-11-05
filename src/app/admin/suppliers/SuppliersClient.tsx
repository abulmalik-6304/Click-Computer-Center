// src/app/admin/suppliers/SuppliersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Supplier } from "./page";

type ModalMode = "create" | "edit" | null;

function cleanPhone(phone: string): string {
  return String(phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function whatsAppUrl(phone: string): string {
  const clean = cleanPhone(phone);
  return clean ? `https://wa.me/${clean}` : "";
}

function telegramUrl(phone: string): string {
  const clean = cleanPhone(phone);
  return clean ? `https://t.me/+${clean}` : "";
}

export default function SuppliersClient({
  initialSuppliers,
  userRole,
  canPrint,
}: {
  initialSuppliers: Supplier[];
  userRole: string;
  canPrint: boolean;
}) {
  const [items, setItems] = useState(initialSuppliers);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<Supplier | null>(null);

  const canEdit = ["owner", "manager"].includes(userRole);

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

  const stats = {
    total: items.length,
    withCompany: items.filter((s) => s.company).length,
    withPhone: items.filter((s) => s.phone).length,
  };

  async function refresh() {
    try {
      const res = await fetch("/api/suppliers", { cache: "no-store" });
            const data = await res.json();
      if (Array.isArray(data.suppliers)) setItems(data.suppliers);
    } catch (e) {
      console.error(e);
    }
  }

  // ✅ PRINT
  function printList() {
    const rows = filtered
      .map(
        (s) => `
        <tr>
          <td>${s.name}</td>
          <td>${s.company || "—"}</td>
          <td>${s.phone || "—"}</td>
          <td>${s.supplyItem || "—"}</td>
          <td>${s.address || "—"}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html><head><title>Suppliers List</title>
      <style>
        body{font-family:Arial;padding:24px;color:#0f172a;max-width:900px;margin:0 auto}
        h1{font-size:20px;margin:0 0 4px}
        .small{font-size:12px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
        th{background:#f1f5f9;font-weight:bold}
        .footer{margin-top:24px;text-align:center;font-size:11px;color:#94a3b8}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Suppliers List · ${filtered.length} suppliers · Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Company</th><th>Phone</th><th>Supply Item(s)</th><th>Address</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="footer">Click Computer Center · Confidential</p>
      </body></html>
    `;

    const w = window.open("", "_blank", "width=900,height=700");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🏭 Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} registered suppliers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPrint && (
            <button
              onClick={printList}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm"
            >
              🖨 Print List
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => { setActive(null); setModal("create"); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
            >
              + Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="With Company" value={stats.withCompany} color="emerald" />
        <StatCard label="With Phone" value={stats.withPhone} color="orange" />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 print:hidden">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, company, phone, item…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🏭</p>
          <p className="text-slate-500">No suppliers found</p>
          {canEdit && (
            <button
              onClick={() => setModal("create")}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm"
            >
              Add the first one
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const waUrl = whatsAppUrl(s.phone);
            const tgUrl = telegramUrl(s.phone);
            const hasPhone = !!cleanPhone(s.phone);

            return (
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

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-sm">
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

                {/* ✅ Contact Buttons */}
                {hasPhone && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg text-center transition"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {tgUrl && (
                      <a
                        href={tgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg text-center transition"
                      >
                        ✈️ Telegram
                      </a>
                    )}
                  </div>
                )}

                {canEdit && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
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
                )}
              </div>
            );
          })}
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
  title,
  existing,
  onClose,
  onSaved,
}: {
  title: string;
  existing?: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    company: existing?.company ?? "",
    phone: existing?.phone ?? "",
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>

        <Field label="Supplier Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Supply Item(s)" value={form.supplyItem} onChange={(v) => setForm({ ...form, supplyItem: v })} placeholder="e.g. Laptops, Monitors" />
        <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50">
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls = {
    slate: "text-slate-700 bg-slate-50",
    emerald: "text-emerald-700 bg-emerald-50",
    orange: "text-orange-700 bg-orange-50",
  }[color] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`${cls} p-4 rounded-2xl border border-slate-200`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}
