// src/app/admin/sales/SalesHistory.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import VoidSaleModal from "@/components/admin/sales/VoidSaleModal";

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

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-orange-100 text-orange-700",
  unpaid: "bg-red-100 text-red-700",
};

const SALE_STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  voided: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
};

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num) ? "0" : num.toLocaleString();
}

export default function SalesHistory({
  userRole,
  canVoid = false,
  canRefund = false,
  canDelete = false,
}: {
  userRole: string;
  canVoid?: boolean;
  canRefund?: boolean;
  canDelete?: boolean;
}) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [saleStatusFilter, setSaleStatusFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 1,
  });
  const [summary, setSummary] = useState({
    revenue: 0, paid: 0, outstanding: 0, count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Sale | null>(null);
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status !== "all") params.set("status", status);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/sales/history?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data.rows)) {
        let filtered = data.rows;
        if (saleStatusFilter !== "all") {
          filtered = filtered.filter(
            (r: Sale) => r.saleStatus.toLowerCase() === saleStatusFilter
          );
        }
        setRows(filtered);
        setPagination(data.pagination);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, from, to, status, sort, page, saleStatusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, from, to, status, sort, saleStatusFilter]);

  function clearFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setStatus("all");
    setSaleStatusFilter("all");
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
            placeholder="🔍 Search invoice, customer…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">All Payment</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={saleStatusFilter}
            onChange={(e) => setSaleStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="voided">Voided</option>
            <option value="refunded">Refunded</option>
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
            onClick={() => load()}
            className="px-3 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Mini label="Sales" value={summary.count} />
        <Mini label="Revenue" value={`${fmt(summary.revenue)} ETB`} color="emerald" />
        <Mini label="Paid" value={`${fmt(summary.paid)} ETB`} color="emerald" />
        <Mini
          label="Outstanding"
          value={`${fmt(summary.outstanding)} ETB`}
          color={summary.outstanding > 0 ? "red" : "slate"}
        />
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
                <th className="text-right px-3 py-3 font-semibold">Amount</th>
                <th className="text-left px-3 py-3 font-semibold hidden sm:table-cell">
                  Payment
                </th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">
                  Status
                </th>
                <th className="text-right px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No sales found
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr
                    key={s.salesId}
                    className={`border-t border-slate-100 hover:bg-slate-50 ${
                      s.saleStatus === "Voided" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {s.invoiceNo || s.salesId}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">{s.customerName}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {fmt(s.totalAmount)}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[s.paymentStatus.toLowerCase()] ??
                          "bg-slate-100"
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          SALE_STATUS_COLORS[s.saleStatus.toLowerCase()] ??
                          "bg-slate-100"
                        }`}
                      >
                        {s.saleStatus}
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
            Page {pagination.page} of {pagination.totalPages} ·{" "}
            {pagination.total} total
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
      {active && (
        <SaleDetailModal
          sale={active}
          canVoid={canVoid}
          canRefund={canRefund}
          canDelete={canDelete}
          onVoid={() => {
            setVoidTarget(active);
            setActive(null);
          }}
          onClose={() => setActive(null)}
          onDeleted={() => {
            setActive(null);
            load();
          }}
        />
      )}

      {/* Void Modal */}
      {voidTarget && (
        <VoidSaleModal
          salesId={voidTarget.salesId}
          invoiceNo={voidTarget.invoiceNo}
          totalAmount={voidTarget.totalAmount}
          saleStatus={voidTarget.saleStatus}
          canVoid={canVoid}
          canRefund={canRefund}
          canDelete={canDelete}
          onClose={() => setVoidTarget(null)}
          onSuccess={() => {
            setVoidTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Mini({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: any;
  color?: string;
}) {
  const cls =
    {
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

// ─── Sale Detail Modal ───
function SaleDetailModal({
  sale,
  canVoid,
  canRefund,
  canDelete,
  onVoid,
  onClose,
  onDeleted,
}: {
  sale: Sale;
  canVoid: boolean;
  canRefund: boolean;
  canDelete: boolean;
  onVoid: () => void;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isVoided = sale.saleStatus === "Voided";
  const isRefunded = sale.saleStatus === "Refunded";
  const isDraft = sale.saleStatus === "Draft";

  // Can take action if:
  // - Not already voided/refunded
  // - Has relevant permission
  const canTakeVoid = canVoid && !isVoided && !isRefunded;
  const canTakeRefund = canRefund && !isVoided && !isRefunded;
  const canTakeDelete = canDelete && !isVoided && !isRefunded;

  const showAnyAction = canTakeVoid || canTakeRefund || canTakeDelete;

  async function handleHardDelete() {
    if (!confirm(
      `⚠️ PERMANENTLY DELETE ${sale.invoiceNo || sale.salesId}?\n\n` +
      `This will:\n` +
      `• Restore stock to inventory\n` +
      `• Remove revenue from reports\n` +
      `• Cannot be undone\n\n` +
      `Continue?`
    )) return;

    const reason = prompt("Reason for deletion (required):");
    if (!reason?.trim()) {
      alert("Deletion cancelled — reason required");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/sales/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesId: sale.salesId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Delete failed");
        return;
      }
      alert(
        `✅ Sale deleted!\n` +
        `• ${data.restoredItems} items restored\n` +
        `• ${data.revenueRemoved.toLocaleString()} ETB removed from revenue`
      );
      onDeleted();
    } catch (e: any) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  function buildReceiptText(): string {
    const items = sale.items
      .map(
        (i) => `  • ${i.itemName} × ${i.quantity} = ${fmt(i.totalPrice)} ETB`
      )
      .join("\n");
    const outstanding = sale.totalAmount - sale.paidAmount;
    return [
      "🧾 *CLICK COMPUTER CENTER*",
      "───────────────────────",
      `📄 Invoice: ${sale.invoiceNo || sale.salesId}`,
      `📅 Date: ${new Date(sale.date).toLocaleDateString()}`,
      `👤 Customer: ${sale.customerName}`,
      `💳 Payment: ${sale.paymentMethod} (${sale.paymentStatus})`,
      `📋 Status: ${sale.saleStatus}`,
      "───────────────────────",
      "📦 *Items:*",
      items,
      "───────────────────────",
      `Subtotal: ${fmt(sale.items.reduce((s, i) => s + i.totalPrice, 0))} ETB`,
      sale.discount > 0 ? `Discount: -${fmt(sale.discount)} ETB` : "",
      `*TOTAL: ${fmt(sale.totalAmount)} ETB*`,
      `Paid: ${fmt(sale.paidAmount)} ETB`,
      outstanding > 0 ? `⚠️ Outstanding: ${fmt(outstanding)} ETB` : "",
      "───────────────────────",
      "🙏 Thank you!",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function copyReceipt() {
    const text = buildReceiptText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function printReceipt() {
    const html = `
      <html><head><title>Receipt ${sale.invoiceNo}</title>
      <style>
        body{font-family:Arial;padding:20px;max-width:400px;margin:0 auto;color:#0f172a}
        h1{font-size:18px;margin:0 0 4px}
        .small{font-size:12px;color:#666}
        hr{border:none;border-top:1px dashed #999;margin:8px 0}
        table{width:100%;font-size:13px;border-collapse:collapse}
        td{padding:4px 0}
        .right{text-align:right}
        .total{font-weight:bold;font-size:15px}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Ethiopia</p><hr/>
        <p><strong>Invoice:</strong> ${sale.invoiceNo || sale.salesId}</p>
        <p><strong>Date:</strong> ${new Date(sale.date).toLocaleDateString()}</p>
        <p><strong>Customer:</strong> ${sale.customerName}</p>
        <p><strong>Status:</strong> ${sale.saleStatus}</p>
        <hr/>
        <table>
          <thead><tr><td><strong>Item</strong></td><td class="right"><strong>Qty</strong></td><td class="right"><strong>Price</strong></td></tr></thead>
          <tbody>
            ${sale.items
              .map(
                (i) =>
                  `<tr><td>${i.itemName}</td><td class="right">${i.quantity}</td><td class="right">${fmt(i.totalPrice)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <hr/>
        <p class="total right">TOTAL: ${fmt(sale.totalAmount)} ETB</p>
        <p class="right">Paid: ${fmt(sale.paidAmount)} ETB</p>
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
            <p className="text-sm text-slate-500">
              {new Date(sale.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Voided banner */}
        {isVoided && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-bold text-red-700">🚫 VOIDED</p>
            <p className="text-xs text-red-600 mt-1">
              This sale has been voided. Stock restored.
            </p>
          </div>
        )}

        {/* Refunded banner */}
        {isRefunded && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-bold text-orange-700">💵 REFUNDED</p>
            <p className="text-xs text-orange-600 mt-1">
              Customer returned. Stock restored. Not counted in revenue.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Customer:</span>{" "}
            <strong>{sale.customerName}</strong>
          </div>
          <div>
            <span className="text-slate-500">Staff:</span>{" "}
            <strong>{sale.staffName || "—"}</strong>
          </div>
          <div>
            <span className="text-slate-500">Payment:</span>{" "}
            <strong>{sale.paymentMethod}</strong>
          </div>
          <div>
            <span className="text-slate-500">Sale Status:</span>{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                SALE_STATUS_COLORS[sale.saleStatus.toLowerCase()] ?? ""
              }`}
            >
              {sale.saleStatus}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <h3 className="font-semibold text-slate-900 mb-2">
            Items ({sale.items.length})
          </h3>
          <div className="space-y-1">
            {sale.items.map((i) => (
              <div
                key={i.salesItemId}
                className="flex justify-between text-sm py-1 border-b border-slate-50"
              >
                <div className="flex-1">
                  <p className="text-slate-900">{i.itemName}</p>
                  <p className="text-xs text-slate-500">
                    {i.quantity} × {fmt(i.sellingPrice)} ETB
                  </p>
                </div>
                <p className="font-medium text-slate-900">{fmt(i.totalPrice)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
          <Row
            label="Subtotal"
            value={fmt(sale.items.reduce((s, i) => s + i.totalPrice, 0))}
          />
          <Row label="Discount" value={fmt(sale.discount)} />
          <Row label="Total" value={fmt(sale.totalAmount)} bold />
          <Row label="Paid" value={fmt(sale.paidAmount)} />
          <Row label="Outstanding" value={fmt(sale.totalAmount - sale.paidAmount)} />
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          {/* Row 1: Print + Copy + Close */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={printReceipt}
              className="py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm"
            >
              🖨 Print
            </button>
            <button
              onClick={copyReceipt}
              className={`py-2.5 rounded-lg font-semibold text-sm ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {copied ? "✅ Copied" : "📋 Copy"}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
            >
              Close
            </button>
          </div>

          {/* Row 2: Void / Refund / Hard Delete */}
          {showAnyAction && (
            <div
              className={`grid gap-2 ${
                [canTakeVoid, canTakeRefund, canTakeDelete].filter(Boolean)
                  .length === 3
                  ? "grid-cols-3"
                  : [canTakeVoid, canTakeRefund, canTakeDelete].filter(Boolean)
                      .length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {canTakeVoid && (
                <button
                  onClick={onVoid}
                  className="py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
                >
                  🚫 Void
                </button>
              )}
              {canTakeRefund && (
                <button
                  onClick={onVoid}
                  className="py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm"
                >
                  💵 Refund
                </button>
              )}
              {canTakeDelete && (
                <button
                  onClick={handleHardDelete}
                  disabled={deleting}
                  className="py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-sm disabled:opacity-50"
                  title="Permanently delete — restores stock"
                >
                  {deleting ? "Deleting…" : "🗑 Hard Delete"}
                </button>
              )}
            </div>
          )}

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          {!showAnyAction && !isVoided && !isRefunded && (
            <p className="text-xs text-slate-400 text-center py-1">
              ⓘ No actions available — ask owner for permission
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-900"}>
        {value} ETB
      </span>
    </div>
  );
}
