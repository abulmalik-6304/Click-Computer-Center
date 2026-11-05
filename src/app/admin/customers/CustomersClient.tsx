// src/app/admin/customers/CustomersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Customer } from "./page";
import { CUSTOMER_TYPE_COLORS, CUSTOMER_TYPE_ICONS } from "@/lib/supplier-customer-types";

type ModalMode = "create" | "edit" | null;

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num) ? "0" : num.toLocaleString();
}

// ✅ WhatsApp/Telegram URL helpers
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

export default function CustomersClient({
  initialCustomers,
  userRole,
  canPrint,
}: {
  initialCustomers: Customer[];
  userRole: string;
  canPrint: boolean;
}) {
  const [items, setItems] = useState(initialCustomers);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "vip" | "wholesale">("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<Customer | null>(null);

  const canEdit = ["owner", "manager"].includes(userRole);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (c) =>
          c.name.toLowerCase().includes(lq) ||
          c.phone.toLowerCase().includes(lq) ||
          c.email.toLowerCase().includes(lq)
      );
    }
    if (typeFilter !== "all") {
      out = out.filter((c) => c.type.toLowerCase() === typeFilter);
    }
    return out;
  }, [items, q, typeFilter]);

  const stats = {
    total: items.length,
    vip: items.filter((c) => c.type.toLowerCase() === "vip").length,
    wholesale: items.filter((c) => c.type.toLowerCase() === "wholesale").length,
    lifetimeValue: items.reduce((s, c) => s + c.totalAmount, 0),
  };

  async function refresh() {
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.customers)) setItems(data.customers);
    } catch (e) {
      console.error(e);
    }
  }

  // ✅ PRINT
  function printList() {
    const rows = filtered
      .map(
        (c) => `
        <tr>
          <td>${c.name}</td>
          <td>${c.phone || "—"}</td>
          <td>${c.email || "—"}</td>
          <td>${c.type}</td>
          <td style="text-align:right">${fmt(c.totalAmount)} ETB</td>
          <td style="text-align:right">${c.transactionCount}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html><head><title>Customers List</title>
      <style>
        body{font-family:Arial;padding:24px;color:#0f172a;max-width:800px;margin:0 auto}
        h1{font-size:20px;margin:0 0 4px}
        .small{font-size:12px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
        th{background:#f1f5f9;font-weight:bold}
        .footer{margin-top:24px;text-align:center;font-size:11px;color:#94a3b8}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Customers List · ${filtered.length} customers · Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Email</th><th>Type</th>
              <th style="text-align:right">Lifetime</th><th style="text-align:right">Purchases</th>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🧑 Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} customers · {stats.vip} VIP · {stats.wholesale} wholesale
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
              + Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="VIP" value={stats.vip} color="amber" />
        <StatCard label="Wholesale" value={stats.wholesale} color="emerald" />
        <StatCard label="Lifetime" value={`${fmt(stats.lifetimeValue)} ETB`} color="emerald" />
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 print:hidden">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, phone, email…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-slate-500 self-center">Type:</span>
          {(["all", "regular", "vip", "wholesale"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                typeFilter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🧑</p>
          <p className="text-slate-500">No customers found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const waUrl = whatsAppUrl(c.phone);
            const tgUrl = telegramUrl(c.phone);
            const hasPhone = !!cleanPhone(c.phone);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {c.name.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-sm text-slate-500 truncate">{c.phone || "No phone"}</p>
                    <span
                      className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        CUSTOMER_TYPE_COLORS[c.type.toLowerCase()] ?? "bg-slate-100"
                      }`}
                    >
                      {CUSTOMER_TYPE_ICONS[c.type.toLowerCase()] ?? "👤"} {c.type}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-sm">
                  {c.email && (
                    <p className="text-slate-700 truncate">
                      <span className="text-slate-500">📧</span> {c.email}
                    </p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchases:</span>
                    <span className="font-semibold text-slate-900">{c.transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lifetime value:</span>
                    <span className="font-semibold text-emerald-600">
                      {fmt(c.totalAmount)} ETB
                    </span>
                  </div>
                  {c.lastPurchase && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last:</span>
                      <span className="text-slate-700 text-xs">
                        {c.lastPurchase.slice(0, 10)}
                      </span>
                    </div>
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
                      onClick={() => { setActive(c); setModal("edit"); }}
                      className="py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${c.name}"?`)) return;
                        await fetch("/api/customers", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: c.id }),
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
        <CustomerForm
          title="Add Customer"
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal === "edit" && active && (
        <CustomerForm
          title={`Edit: ${active.name}`}
          existing={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Customer Form ───
function CustomerForm({
  title,
  existing,
  onClose,
  onSaved,
}: {
  title: string;
  existing?: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    type: existing?.type ?? "Regular",
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
      const res = await fetch("/api/customers", {
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

        <Field label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+251 9XX XXX XXX" />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Customer Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            <option value="Regular">👤 Regular</option>
            <option value="VIP">⭐ VIP</option>
            <option value="Wholesale">🏪 Wholesale</option>
          </select>
        </div>

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
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Customer"}
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
    amber: "text-amber-700 bg-amber-50",
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
