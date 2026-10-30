// src/app/admin/customers/CustomersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { CustomerWithStats } from "./page";

type ModalMode = "create" | "edit" | null;

const TYPE_COLORS: Record<string, string> = {
  regular: "bg-slate-100 text-slate-700",
  vip: "bg-amber-100 text-amber-700",
  wholesale: "bg-emerald-100 text-emerald-700",
};

export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: CustomerWithStats[];
}) {
  const [items, setItems] = useState(initialCustomers);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "vip" | "wholesale">("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<CustomerWithStats | null>(null);

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
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (Array.isArray(data.customers)) {
        // Reload from server (which recalculates stats)
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🧑 Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} customers · {stats.vip} VIP · {stats.wholesale} wholesale
          </p>
        </div>
        <button
          onClick={() => { setActive(null); setModal("create"); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition"
        >
          + Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={stats.total} color="slate" />
        <StatCard label="VIP" value={stats.vip} color="amber" />
        <StatCard label="Wholesale" value={stats.wholesale} color="emerald" />
        <StatCard label="Lifetime Value" value={`${stats.lifetimeValue.toLocaleString()} ETB`} color="emerald" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🧑</p>
          <p className="text-slate-500">No customers yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{c.name}</p>
                  <p className="text-sm text-slate-500 truncate">{c.phone || "—"}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      TYPE_COLORS[c.type.toLowerCase()] ?? "bg-slate-100"
                    }`}
                  >
                    {c.type}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-sm">
                {c.email && <p className="text-slate-700 truncate">📧 {c.email}</p>}
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchases:</span>
                  <span className="font-semibold text-slate-900">{c.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lifetime value:</span>
                  <span className="font-semibold text-emerald-600">
                    {c.totalAmount.toLocaleString()} ETB
                  </span>
                </div>
                {c.lastPurchase && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last:</span>
                    <span className="text-slate-700">{c.lastPurchase.slice(0, 10)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setActive(c); setModal("edit"); }}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CustomerModal
          mode={modal}
          customer={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={refresh}
        />
      )}
    </div>
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Failed to delete customer");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete customer");
    }
  }
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "slate" | "amber" | "emerald";
}) {
  const colorMap = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CustomerModal({
  mode,
  customer,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  customer: CustomerWithStats | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [type, setType] = useState(customer?.type ?? "regular");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = mode === "create" ? "/api/customers" : `/api/customers/${customer?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save customer");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "create" ? "Add Customer" : "Edit Customer"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 capitalize"
            >
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
