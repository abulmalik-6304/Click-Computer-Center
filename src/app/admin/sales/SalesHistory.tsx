// src/app/admin/sales/SalesHistory.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

interface SaleItem {
  salesItemId: string;
  itemId: string;
  itemName: string;
  sellingPrice: number;
  quantity: number;
  totalPrice: number;
  costPerItem: number;
  totalCost: number;
}

interface Sale {
  salesId: string;
  date: string;
  customerName: string;
  staffName: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  invoiceNo: string;
  saleStatus: string;
  items: SaleItem[];
}

interface Summary {
  revenue: number;
  paid: number;
  outstanding: number;
  count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-orange-100 text-orange-700",
  unpaid: "bg-red-100 text-red-700",
};

export default function SalesHistory({ onRefresh }: { onRefresh?: () => void }) {
  // Filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [staff, setStaff] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(1);

  // Data
  const [rows, setRows] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 1,
  });
  const [summary, setSummary] = useState<Summary>({
    revenue: 0, paid: 0, outstanding: 0, count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Sale | null>(null);

  // ─── Load data ───
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status !== "all") params.set("status", status);
    if (staff) params.set("staff", staff);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/sales/history?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.rows)) {
        setRows(data.rows);
        setPagination(data.pagination);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, from, to, status, staff, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [q, from, to, status, staff, sort]);

  function clearFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setStatus("all");
    setStaff("");
    setSort("date_desc");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search invoice, customer, staff…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <input
            value={staff}
            onChange={(e) => setStaff(e.target.value)}
            placeholder="Staff name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="amount_desc">Highest amount</option>
            <option value="amount_asc">Lowest amount</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
          >
            ✕ Clear
          </button>
          <button
            onClick={() => { load(); onRefresh?.(); }}
            className="px-3 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Mini label="Sales Count" value={summary.count} />
        <Mini label="Revenue" value={`${summary.revenue.toLocaleString()} ETB`} color="emerald" />
        <Mini label="Paid" value={`${summary.paid.toLocaleString()} ETB`} color="emerald" />
        <Mini label="Outstanding" value={`${summary.outstanding.toLocaleString()} ETB`} color={summary.outstanding > 0 ? "red" : "slate"} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold">Invoice</th>
                <th className="text-left px-3 py-3 font-semibold">Date</th>
                <th className="text-left px-3 py-3 font-semibold">Customer</th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">Staff</th>
                <th className="text-right px-3 py-3 font-semibold">Amount</th>
                <th className="text-left px-3 py-3 font-semibold hidden sm:table-cell">Status</th>
                <th className="text-right px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">No sales found</td></tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.salesId} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{s.invoiceNo || s.salesId}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(s.date)}</td>
                    <td className="px-3 py-3">{s.customerName}</td>
                    <td className="px-3 py-3 text-slate-600 hidden md:table-cell">{s.staffName || "—"}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {s.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.paymentStatus.toLowerCase()] ?? "bg-slate-100 text-slate-700"}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setActive(s)}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                      >
                        👁 View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {active && <SaleDetailModal sale={active} onClose={() => setActive(null)} />}
    </div>
  );
}

// ─── Components ───

function Mini({ label, value, color = "slate" }: { label: string; value: any; color?: string }) {
  const cls = {
    emerald: "text-emerald-600",
    red: "text-red-600",
    slate: "text-slate-900",
  }[color] ?? "text-slate-900";

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${cls}`}>{value}</p>
    </div>
  );
}

function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  // ─── የጽሑፍ ደረሰኝ መፍጠሪያ (ለ Copy & Share) ───
  function buildReceiptText(): string {
    const items = sale.items
      .map((i) => `  • ${i.itemName} × ${i.quantity} = ${i.totalPrice.toLocaleString()} ETB`)
      .join("\n");
    const outstanding = sale.totalAmount - sale.paidAmount;
    return [
      "🧾 *CLICK COMPUTER CENTER*",
      "───────────────────────",
      `📄 Invoice: ${sale.invoiceNo || sale.salesId}`,
      `📅 Date: ${formatDate(sale.date)}`,
      `👤 Customer: ${sale.customerName}`,
      `👨‍💼 Staff: ${sale.staffName || "—"}`,
      `💳 Payment: ${sale.paymentMethod} (${sale.paymentStatus})`,
      "───────────────────────",
      "📦 *Items:*",
      items,
      "───────────────────────",
      `Subtotal: ${sale.items.reduce((s, i) => s + i.totalPrice, 0).toLocaleString()} ETB`,
      sale.discount > 0 ? `Discount: -${sale.discount.toLocaleString()} ETB` : "",
      `*TOTAL: ${sale.totalAmount.toLocaleString()} ETB*`,
      `Paid: ${sale.paidAmount.toLocaleString()} ETB`,
      outstanding > 0 ? `⚠️ Outstanding: ${outstanding.toLocaleString()} ETB` : "",
      "───────────────────────",
      "🙏 Thank you for your business!",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // ─── Copy ───
  async function copyReceipt() {
    const text = buildReceiptText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // ─── Share ───
  async function shareReceipt() {
    const text = buildReceiptText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${sale.invoiceNo || sale.salesId}`,
          text,
        });
      } catch {
        // user cancelled
      }
    } else {
      await copyReceipt();
      alert("Share not supported on this browser. Receipt copied to clipboard instead.");
    }
  }

  function printReceipt() {
    const html = `
      <html><head><title>Receipt ${sale.invoiceNo}</title>
      <style>
        body{font-family:Arial;padding:20px;max-width:400px;margin:0 auto}
        h1{font-size:18px;margin:0 0 4px}
        .small{font-size:12px;color:#666}
        hr{border:none;border-top:1px solid #ddd;margin:8px 0}
        table{width:100%;font-size:13px;border-collapse:collapse}
        td{padding:4px 0}
        .right{text-align:right}
        .total{font-weight:bold;font-size:15px}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Ethiopia</p><hr/>
        <p><strong>Invoice:</strong> ${sale.invoiceNo || sale.salesId}</p>
        <p><strong>Date:</strong> ${formatDate(sale.date)}</p>
        <p><strong>Customer:</strong> ${sale.customerName}</p>
        <hr/>
        <table>
          <thead><tr><td><strong>Item</strong></td><td class="right"><strong>Qty</strong></td><td class="right"><strong>Price</strong></td></tr></thead>
          <tbody>
            ${sale.items.map((i) => `<tr><td>${i.itemName}</td><td class="right">${i.quantity}</td><td class="right">${i.totalPrice.toLocaleString()}</td></tr>`).join("")}
          </tbody>
        </table>
        <hr/>
        <p class="total right">TOTAL: ${sale.totalAmount.toLocaleString()} ETB</p>
        <p class="right">Paid: ${sale.paidAmount.toLocaleString()} ETB</p>
        <p class="right small">Status: ${sale.paymentStatus}</p>
        <hr/>
        <p class="small right">Thank you!</p>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=500,height=700");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {sale.invoiceNo || sale.salesId}
            </h2>
            <p className="text-sm text-slate-500">{formatDate(sale.date)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Customer:</span> <strong>{sale.customerName}</strong></div>
          <div><span className="text-slate-500">Staff:</span> <strong>{sale.staffName || "—"}</strong></div>
          <div><span className="text-slate-500">Payment:</span> <strong>{sale.paymentMethod}</strong></div>
          <div>
            <span className="text-slate-500">Status:</span>{" "}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[sale.paymentStatus.toLowerCase()] ?? ""}`}>
              {sale.paymentStatus}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <h3 className="font-semibold text-slate-900 mb-2">Items ({sale.items.length})</h3>
          <div className="space-y-1">
            {sale.items.map((i) => (
              <div key={i.salesItemId} className="flex justify-between text-sm py-1 border-b border-slate-50">
                <div className="flex-1">
                  <p className="text-slate-900">{i.itemName}</p>
                  <p className="text-xs text-slate-500">
                    {i.quantity} × {i.sellingPrice.toLocaleString()} ETB
                  </p>
                </div>
                <p className="font-medium text-slate-900">{i.totalPrice.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
          <Row label="Subtotal" value={sale.items.reduce((s, i) => s + i.totalPrice, 0)} />
          <Row label="Discount" value={sale.discount} />
          <Row label="Total" value={sale.totalAmount} bold />
          <Row label="Paid" value={sale.paidAmount} />
          <Row label="Outstanding" value={sale.totalAmount - sale.paidAmount} />
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={printReceipt}
            className="py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition"
            title="Print Receipt"
          >
            🖨 Print
          </button>
          <button
            onClick={copyReceipt}
            className={`py-2.5 rounded-lg font-semibold text-sm transition ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            title="Copy receipt text"
          >
            {copied ? "✅ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={shareReceipt}
            className="py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition"
            title="Share receipt"
          >
            🔗 Share
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-900"}>
        {value.toLocaleString()} ETB
      </span>
    </div>
  );
}

function formatDate(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
