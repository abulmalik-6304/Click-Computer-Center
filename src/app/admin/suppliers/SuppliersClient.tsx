// src/app/admin/suppliers/SuppliersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Supplier } from "./page";

type ModalMode = "create" | "edit" | "detail" | null;

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num) ? "0" : num.toLocaleString();
}

function cleanPhone(phone: string): string {
  return String(phone || "").replace(/[^\d+]/g, ""
  return clean ? `https://wa.me/${clean}` : "";
}

function telegramUrl(phone: string): string {
  const clean = cleanPhone(phone);
  return clean ? `https://t.me/+${clean}` : "";
}

interface Purchase {
  stockInId: string;
  date: string;
  itemId: string;
  quantity: number;
  buyingPrice: number;
  totalPrice: number;
  recordedBy: string;
  note: string;
}

interface SupplierItem {
  id: string;
  name: string;
  code: string;
  costPrice: number;
  sellingPrice: number;
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
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  async function loadDetail(supplier: Supplier) {
    setActive(supplier);
    setModal("detail");
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(
        `/api/suppliers/detail?id=${encodeURIComponent(supplier.id)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) setDetail(data);
      else console.error("Detail error:", data.error);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  function printList() {
    const rows = filtered
      .map(
        (s) => `
        <tr>
          <td>${s.name}</td>
          <td>${s.company || "—"}</td>
          <td>${s.phone || "—"}</td>
          <td>${s.supplyItem || "—"}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html><head><title>Suppliers List</title>
      <style>
        body{font-family:Arial;padding:24px;max-width:800px;margin:0 auto}
        h1{font-size:20px;margin:0 0 4px}
        .small{font-size:12px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
        th{background:#f1f5f9;font-weight:bold}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Suppliers List · ${filtered.length} suppliers · ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Supply Item(s)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
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
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="With Company" value={stats.withCompany} color="emerald" />
        <StatCard label="With Phone" value={stats.withPhone} color="orange" />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, company, phone, item…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
        />
      </div>

      {/* Compact Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🏭</p>
          <p className="text-slate-500">No suppliers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => loadDetail(s)}
              className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md hover:border-emerald-400 transition text-center group"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold group-hover:ring-2 group-hover:ring-emerald-400 transition">
                🏭
              </div>
              <p className="mt-2 font-semibold text-sm text-slate-900 truncate">
                {s.name}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {s.company || "—"}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {modal === "detail" && active && (
        <SupplierDetailModal
          supplier={active}
          detail={detail}
          loading={detailLoading}
          canPrint={canPrint}
          canEdit={canEdit}
          onEdit={() => setModal("edit")}
          onClose={() => { setModal(null); setActive(null); setDetail(null); }}
        />
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

// ═══════════════════════════════════════════════════════════════
// SUPPLIER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
function SupplierDetailModal({
  supplier,
  detail,
  loading,
  canPrint,
  canEdit,
  onEdit,
  onClose,
}: {
  supplier: Supplier;
  detail: any;
  loading: boolean;
  canPrint: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const waUrl = whatsAppUrl(supplier.phone);
  const tgUrl = telegramUrl(supplier.phone);

  function printDetail() {
    if (!detail) return;

    const itemsHtml = (detail.items || [])
      .map(
        (i: SupplierItem) => `
        <tr>
          <td>${i.name}</td>
          <td>${i.code}</td>
          <td style="text-align:right">${fmt(i.costPrice)}</td>
          <td style="text-align:right">${fmt(i.sellingPrice)}</td>
        </tr>
      `
      )
      .join("");

    const purchasesHtml = (detail.purchases || [])
      .map(
        (p: Purchase) => `
        <tr>
          <td>${p.date.slice(0, 10)}</td>
          <td>${p.itemId}</td>
          <td style="text-align:right">${p.quantity}</td>
          <td style="text-align:right">${fmt(p.buyingPrice)}</td>
          <td style="text-align:right">${fmt(p.totalPrice)}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html><head><title>${supplier.name} — Statement</title>
      <style>
        body{font-family:Arial;padding:24px;max-width:800px;margin:0 auto}
        h1{font-size:20px;margin:0 0 4px}
        h2{font-size:14px;margin:16px 0 8px;border-bottom:2px solid #10b981;padding-bottom:2px}
        .small{font-size:12px;color:#666}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px}
        table{width:100%;border-collapse:collapse;font-size:11px;margin:8px 0}
        th,td{padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
        th{background:#f1f5f9;font-weight:bold}
        .kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}
        .kpi div{padding:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;text-align:center}
        .kpi .label{font-size:10px;color:#666}
        .kpi .value{font-size:14px;font-weight:bold;margin-top:2px}
        .footer{margin-top:24px;text-align:center;font-size:11px;color:#94a3b8}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Supplier Statement · ${new Date().toLocaleString()}</p>
        <h2>Supplier Info</h2>
        <div class="info">
          <div><strong>Name:</strong> ${supplier.name}</div>
          <div><strong>Company:</strong> ${supplier.company || "—"}</div>
          <div><strong>Phone:</strong> ${supplier.phone || "—"}</div>
          <div><strong>Address:</strong> ${supplier.address || "—"}</div>
          <div><strong>Supply Item:</strong> ${supplier.supplyItem || "—"}</div>
          <div><strong>ID:</strong> ${supplier.id}</div>
        </div>
        <h2>Summary</h2>
        <div class="kpi">
          <div><div class="label">Total Purchases</div><div class="value">${fmt(detail.stats?.totalPurchaseValue || 0)} ETB</div></div>
          <div><div class="label">Total Quantity</div><div class="value">${fmt(detail.stats?.totalQuantity || 0)}</div></div>
          <div><div class="label">Transactions</div><div class="value">${detail.stats?.totalPurchases || 0}</div></div>
          <div><div class="label">Items</div><div class="value">${detail.stats?.itemsSupplied || 0}</div></div>
        </div>
        ${
          detail.items?.length > 0
            ? `
              <h2>Items Supplied</h2>
              <table>
                <thead><tr><th>Item</th><th>Code</th><th style="text-align:right">Cost</th><th style="text-align:right">Sell</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
              </table>
            `
            : ""
        }
        ${
          detail.purchases?.length > 0
            ? `
              <h2>Purchase History</h2>
              <table>
                <thead><tr><th>Date</th><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>${purchasesHtml}</tbody>
              </table>
            `
            : `<p class="small">No purchase history yet.</p>`
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">🏭 Supplier Details</h2>
          <div className="flex gap-2">
            {canPrint && (
              <button
                onClick={printDetail}
                disabled={loading || !detail}
                className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                🖨 Print Statement
              </button>
            )}
            {canEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
              >
                ✏️ Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0">
              🏭
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-slate-900">{supplier.name}</p>
              <p className="text-sm text-slate-500">{supplier.company || "—"}</p>
              <p className="text-xs text-slate-400 mt-0.5">{supplier.id}</p>
            </div>
          </div>

          {/* Contact buttons */}
          {(waUrl || tgUrl) && (
            <div className="grid grid-cols-2 gap-2">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-sm bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-center"
                >
                  💬 WhatsApp
                </a>
              )}
              {tgUrl && (
                <a
                  href={tgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-center"
                >
                  ✈️ Telegram
                </a>
              )}
            </div>
          )}

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Phone" value={supplier.phone || "—"} />
            <Info label="Address" value={supplier.address || "—"} />
            <Info label="Supply Item" value={supplier.supplyItem || "—"} />
            <Info label="Supplier ID" value={supplier.id} />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              <p className="mt-2 text-sm text-slate-500">Loading purchases…</p>
            </div>
          ) : detail ? (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi label="Total Purchase" value={`${fmt(detail.stats.totalPurchaseValue)}`} color="emerald" />
                <Kpi label="Quantity" value={`${fmt(detail.stats.totalQuantity)}`} color="slate" />
                <Kpi label="Transactions" value={`${detail.stats.totalPurchases}`} color="slate" />
                <Kpi label="Items" value={`${detail.stats.itemsSupplied}`} color="slate" />
              </div>

              {/* Items Supplied */}
              {detail.items?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    📦 Items Supplied ({detail.items.length})
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-2 py-2 font-semibold">Item</th>
                          <th className="text-left px-2 py-2 font-semibold">Code</th>
                          <th className="text-right px-2 py-2 font-semibold">Cost</th>
                          <th className="text-right px-2 py-2 font-semibold">Sell</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((i: SupplierItem) => (
                          <tr key={i.id} className="border-t border-slate-100">
                            <td className="px-2 py-1.5 font-medium">{i.name}</td>
                            <td className="px-2 py-1.5 text-slate-500">{i.code}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(i.costPrice)}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(i.sellingPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Purchase History */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  📥 Purchase History ({detail.purchases?.length || 0})
                </h3>
                {detail.purchases?.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-2 py-2 font-semibold">Date</th>
                          <th className="text-left px-2 py-2 font-semibold">Item</th>
                          <th className="text-right px-2 py-2 font-semibold">Qty</th>
                          <th className="text-right px-2 py-2 font-semibold">Price</th>
                          <th className="text-right px-2 py-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.purchases.map((p: Purchase) => (
                          <tr key={p.stockInId} className="border-t border-slate-100">
                            <td className="px-2 py-1.5">{p.date.slice(0, 10)}</td>
                            <td className="px-2 py-1.5">{p.itemId}</td>
                            <td className="px-2 py-1.5 text-right">{p.quantity}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(p.buyingPrice)}</td>
                            <td className="px-2 py-1.5 text-right font-medium">{fmt(p.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No purchase history yet
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              Failed to load details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Supplier Form ───
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
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <Field
          label="Supplier Name *"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <Field
          label="Company"
          value={form.company}
          onChange={(v) => setForm({ ...form, company: v })}
        />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
        />
        <Field
          label="Supply Item(s)"
          value={form.supplyItem}
          onChange={(v) => setForm({ ...form, supplyItem: v })}
          placeholder="e.g. Laptops, Monitors"
        />
        <Field
          label="Address"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
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
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  const cls =
    {
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
      red: "bg-red-50 text-red-700 border-red-200",
      slate: "bg-slate-50 text-slate-700 border-slate-200",
    }[color] ?? "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className={`${cls} p-2 rounded-lg border text-center`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-sm font-bold mt-1">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls =
    {
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
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}
