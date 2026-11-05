// src/app/admin/customers/CustomersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Customer } from "./page";
import { CUSTOMER_TYPE_COLORS, CUSTOMER_TYPE_ICONS } from "@/lib/supplier-customer-types";

type ModalMode = "create" | "edit" | "detail" | null;

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num) ? "0" : num.toLocaleString();
}

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

interface Transaction {
  salesId: string;
  date: string;
  invoiceNo: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  staffName: string;
  items: {
    itemId: string;
    itemName: string;
    sellingPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
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
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filtered]);

  const topCustomers = useMemo(() => {
    return [...items]
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }, [items]);

  async function refresh() {
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.customers)) setItems(data.customers);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadDetail(customer: Customer) {
    setActive(customer);
    setModal("detail");
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(
        `/api/customers/detail?id=${encodeURIComponent(customer.id)}`,
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
        (c) => `
        <tr>
          <td>${c.name}</td>
          <td>${c.phone || "—"}</td>
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
        body{font-family:Arial;padding:24px;max-width:800px;margin:0 auto}
        h1{font-size:20px;margin:0 0 4px}
        .small{font-size:12px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
        th{background:#f1f5f9;font-weight:bold}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Customers List · ${filtered.length} customers · ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Type</th><th style="text-align:right">Lifetime</th><th style="text-align:right">Purchases</th></tr></thead>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="VIP" value={stats.vip} color="amber" />
        <StatCard label="Wholesale" value={stats.wholesale} color="emerald" />
        <StatCard label="Lifetime" value={`${fmt(stats.lifetimeValue)} ETB`} color="emerald" />
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-3">🏆 Top Customers</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {topCustomers.map((c, i) => (
              <button
                key={c.id}
                onClick={() => loadDetail(c)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex-shrink-0"
              >
                <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">{c.name}</p>
                  <p className="text-xs text-amber-700">{fmt(c.totalAmount)} ETB</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
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

      {/* Compact Cards Grid */}
      {sortedFiltered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🧑</p>
          <p className="text-slate-500">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedFiltered.map((c) => (
            <button
              key={c.id}
              onClick={() => loadDetail(c)}
              className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md hover:border-orange-400 transition text-center group"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-bold group-hover:ring-2 group-hover:ring-orange-400 transition">
                {c.name.charAt(0).toUpperCase() || "?"}
              </div>
              <p className="mt-2 font-semibold text-sm text-slate-900 truncate">
                {c.name}
              </p>
              <span
                className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  CUSTOMER_TYPE_COLORS[c.type.toLowerCase()] ?? "bg-slate-100"
                }`}
              >
                {CUSTOMER_TYPE_ICONS[c.type.toLowerCase()] ?? "👤"} {c.type}
              </span>
              <p className="mt-1.5 text-xs font-bold text-emerald-600">
                {fmt(c.totalAmount)} ETB
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {modal === "detail" && active && (
        <CustomerDetailModal
          customer={active}
          detail={detail}
          loading={detailLoading}
          canPrint={canPrint}
          canEdit={canEdit}
          onEdit={() => { setModal("edit"); }}
          onClose={() => { setModal(null); setActive(null); setDetail(null); }}
        />
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

// ═══════════════════════════════════════════════════════════════
// CUSTOMER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
function CustomerDetailModal({
  customer,
  detail,
  loading,
  canPrint,
  canEdit,
  onEdit,
  onClose,
}: {
  customer: Customer;
  detail: any;
  loading: boolean;
  canPrint: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const waUrl = whatsAppUrl(customer.phone);
  const tgUrl = telegramUrl(customer.phone);

  function printDetail() {
    if (!detail) return;

    const transactionsHtml = (detail.transactions || [])
      .map(
        (t: Transaction) => `
        <tr>
          <td>${t.date.slice(0, 10)}</td>
          <td>${t.invoiceNo || t.salesId}</td>
          <td>${t.items.length} items</td>
          <td style="text-align:right">${fmt(t.totalAmount)}</td>
          <td style="text-align:right">${fmt(t.paidAmount)}</td>
          <td>${t.paymentStatus}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html><head><title>${customer.name} — Statement</title>
      <style>
        body{font-family:Arial;padding:24px;max-width:800px;margin:0 auto}
        h1{font-size:20px;margin:0 0 4px}
        h2{font-size:14px;margin:16px 0 8px;border-bottom:2px solid #f97316;padding-bottom:2px}
        .small{font-size:12px;color:#666}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px}
        .info div strong{color:#0f172a}
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
        <p class="small">Customer Statement · ${new Date().toLocaleString()}</p>
        <h2>Customer Info</h2>
        <div class="info">
          <div><strong>Name:</strong> ${customer.name}</div>
          <div><strong>Phone:</strong> ${customer.phone || "—"}</div>
          <div><strong>Email:</strong> ${customer.email || "—"}</div>
          <div><strong>Type:</strong> ${customer.type}</div>
          <div><strong>Address:</strong> ${customer.address || "—"}</div>
          <div><strong>ID:</strong> ${customer.id}</div>
        </div>
        <h2>Summary</h2>
        <div class="kpi">
          <div><div class="label">Total Purchases</div><div class="value">${fmt(detail.stats?.totalAmount || 0)} ETB</div></div>
          <div><div class="label">Total Paid</div><div class="value">${fmt(detail.stats?.totalPaid || 0)} ETB</div></div>
          <div><div class="label">Outstanding</div><div class="value">${fmt(detail.stats?.outstanding || 0)} ETB</div></div>
          <div><div class="label">Transactions</div><div class="value">${detail.stats?.totalPurchases || 0}</div></div>
        </div>
        <h2>Transaction History</h2>
        ${
          detail.transactions?.length > 0
            ? `<table>
                <thead><tr><th>Date</th><th>Invoice</th><th>Items</th><th style="text-align:right">Total</th><th style="text-align:right">Paid</th><th>Status</th></tr></thead>
                <tbody>${transactionsHtml}</tbody>
              </table>`
            : `<p class="small">No transactions yet.</p>`
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
          <h2 className="text-lg font-bold text-slate-900">🧑 Customer Details</h2>
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
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {customer.name.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-slate-900">{customer.name}</p>
              <p className="text-sm text-slate-500">{customer.email || "—"}</p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  CUSTOMER_TYPE_COLORS[customer.type.toLowerCase()] ?? "bg-slate-100"
                }`}
              >
                {CUSTOMER_TYPE_ICONS[customer.type.toLowerCase()] ?? "👤"} {customer.type}
              </span>
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
            <Info label="Phone" value={customer.phone || "—"} />
            <Info label="Address" value={customer.address || "—"} />
            <Info label="Customer ID" value={customer.id} />
            <Info label="Recorded By" value={customer.recordedBy || "—"} />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="mt-2 text-sm text-slate-500">Loading transactions…</p>
            </div>
          ) : detail ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi label="Lifetime" value={`${fmt(detail.stats.totalAmount)}`} color="emerald" />
                <Kpi label="Paid" value={`${fmt(detail.stats.totalPaid)}`} color="emerald" />
                <Kpi
                  label="Outstanding"
                  value={`${fmt(detail.stats.outstanding)}`}
                  color={detail.stats.outstanding > 0 ? "red" : "slate"}
                />
                <Kpi label="Transactions" value={`${detail.stats.totalPurchases}`} color="slate" />
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  🧾 Transaction History ({detail.transactions?.length || 0})
                </h3>
                {detail.transactions?.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-2 py-2 font-semibold">Date</th>
                          <th className="text-left px-2 py-2 font-semibold">Invoice</th>
                          <th className="text-left px-2 py-2 font-semibold">Items</th>
                          <th className="text-right px-2 py-2 font-semibold">Total</th>
                          <th className="text-right px-2 py-2 font-semibold">Paid</th>
                          <th className="text-left px-2 py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.transactions.map((t: Transaction) => (
                          <tr key={t.salesId} className="border-t border-slate-100">
                            <td className="px-2 py-1.5">{t.date.slice(0, 10)}</td>
                            <td className="px-2 py-1.5 font-medium">{t.invoiceNo || t.salesId}</td>
                            <td className="px-2 py-1.5">{t.items.length}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(t.totalAmount)}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(t.paidAmount)}</td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  t.paymentStatus === "Paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : t.paymentStatus === "Partial"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {t.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No transactions yet
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
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <Field
          label="Full Name *"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="+251 9XX XXX XXX"
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Customer Type
          </label>
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
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls =
    {
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
