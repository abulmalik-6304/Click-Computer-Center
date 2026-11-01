// src/app/admin/inventory/ItemDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { getStockStatus, getProfitMargin } from "@/lib/inventory-helpers";

interface DetailData {
  item: any;
  stats: any;
  stockInLogs: any[];
  salesLogs: any[];
}

export default function ItemDetailModal({
  itemId,
  userRole,
  onClose,
}: {
  itemId: string;
  userRole: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const canSeeFinance = ["owner", "manager"].includes(userRole);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/inventory/detail?itemId=${itemId}`);
        const d = await res.json();
        if (!res.ok) {
          setError(d.error || "Failed to load");
          return;
        }
        setData(d);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [itemId]);

  function buildTextReport(): string {
    if (!data) return "";
    const i = data.item;
    const s = data.stats;
    const lines = [
      `📦 *${i.name}*`,
      `───────────────────────`,
      `Code: ${i.code || "—"}`,
      `Category: ${i.category || "—"}`,
      `Unit: ${i.unitType || "pcs"}`,
      `───────────────────────`,
      `Selling Price: ${i.sellingPrice.toLocaleString()} ETB`,
    ];
    if (canSeeFinance && s) {
      lines.push(`Cost Price: ${i.costPrice?.toLocaleString?.() || "—"} ETB`);
      lines.push(`Avg Cost: ${i.avgCost?.toLocaleString?.() || "—"} ETB`);
      lines.push(`Profit Margin: ${getProfitMargin(i)}%`);
      lines.push(`───────────────────────`);
      lines.push(`Total Purchased: ${s.totalPurchased ?? "—"}`);
      lines.push(`Total Sold: ${s.totalSold ?? 0}`);
      lines.push(`Total Revenue: ${s.totalRevenue?.toLocaleString?.() ?? "—"} ETB`);
      lines.push(`Total Profit: ${s.totalProfit?.toLocaleString?.() ?? "—"} ETB`);
    } else {
      lines.push(`Stock: ${i.stock}`);
    }
    lines.push(`───────────────────────`);
    lines.push(`Current Stock: ${i.stock}`);
    lines.push(`Status: ${getStockStatus(i)}`);
    lines.push(`───────────────────────`);
    lines.push(`🙏 Click Computer Center`);
    return lines.join("\n");
  }

  async function copyReport() {
    const text = buildTextReport();
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

  async function shareReport() {
    const text = buildTextReport();
    if (navigator.share && data) {
      try {
        await navigator.share({ title: data.item.name, text });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyReport();
      alert("Share not supported — report copied to clipboard.");
    }
  }

  function printReport() {
    if (!data) return;
    const i = data.item;
    const s = data.stats;
    const html = `
      <html><head><title>${i.name} — Click Computer Center</title>
      <style>
        body{font-family:Arial;padding:24px;max-width:600px;margin:0 auto;color:#0f172a}
        h1{font-size:20px;margin:0 0 4px;color:#0f172a}
        h2{font-size:14px;margin:16px 0 6px;color:#0f172a;border-bottom:2px solid #f97316;padding-bottom:2px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        td{padding:4px 0}
        td:first-child{color:#64748b}
        td:last-child{text-align:right;font-weight:600}
        img{width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:12px}
      </style></head><body>
        <h1>${i.name}</h1>
        <p style="margin:0;color:#64748b;font-size:12px">${i.code || ""} · ${i.category || ""}</p>
        ${i.image ? `<img src="${formatDriveUrl(i.image)}" />` : ""}
        <h2>Basic Info</h2>
        <table>
          <tr><td>ID</td><td>${i.id}</td></tr>
          <tr><td>Unit</td><td>${i.unitType}</td></tr>
          <tr><td>Status</td><td>${getStockStatus(i)}</td></tr>
        </table>
        <h2>Pricing</h2>
        <table>
          <tr><td>Selling Price</td><td>${i.sellingPrice.toLocaleString()} ETB</td></tr>
          ${canSeeFinance ? `<tr><td>Cost Price</td><td>${i.costPrice?.toLocaleString?.() || "—"} ETB</td></tr>` : ""}
          ${canSeeFinance ? `<tr><td>Profit Margin</td><td>${getProfitMargin(i)}%</td></tr>` : ""}
        </table>
        <h2>Stock</h2>
        <table>
          <tr><td>Current Stock</td><td>${i.stock}</td></tr>
          ${canSeeFinance ? `<tr><td>Total Purchased</td><td>${s.totalPurchased ?? "—"}</td></tr>` : ""}
          <tr><td>Total Sold</td><td>${s.totalSold ?? 0}</td></tr>
        </table>
        ${canSeeFinance ? `
        <h2>Financials</h2>
        <table>
          <tr><td>Total Revenue</td><td>${s.totalRevenue?.toLocaleString?.() ?? "—"} ETB</td></tr>
          <tr><td>Total Profit</td><td>${s.totalProfit?.toLocaleString?.() ?? "—"} ETB</td></tr>
        </table>` : ""}
        <p style="margin-top:24px;text-align:center;color:#94a3b8;font-size:11px">
          Click Computer Center · ${new Date().toLocaleDateString()}
        </p>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=700,height=800");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">📦 Item Details</h2>
          <div className="flex gap-1">
            <button
              onClick={printReport}
              disabled={!data}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50"
              title="Print"
            >
              🖨
            </button>
            <button
              onClick={copyReport}
              disabled={!data}
              className={`px-3 py-1.5 text-xs rounded-lg disabled:opacity-50 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="Copy"
            >
              {copied ? "✅" : "📋"}
            </button>
            <button
              onClick={shareReport}
              disabled={!data}
              className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
              title="Share"
            >
              🔗
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          </div>
        ) : data ? (
          <div className="p-5 space-y-5">
            {/* Hero */}
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={formatDriveUrl(data.item.image)}
                alt={data.item.name}
                className="w-full sm:w-48 h-48 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/placeholder.svg")
                }
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  {data.item.name}
                </h1>
                <p className="text-sm text-slate-500">
                  {data.item.code} · {data.item.category}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                    {data.item.unitType}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    Stock: {data.item.stock}
                  </span>
                  {data.item.supplierName && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      🏭 {data.item.supplierName}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold text-emerald-600">
                  {data.item.sellingPrice.toLocaleString()}{" "}
                  <span className="text-sm text-slate-400">ETB</span>
                </p>
              </div>
            </div>

            {/* 1. Identification */}
            <Section title="1️⃣ Identification & Basic Info" icon="🆔">
              <Row label="Item ID" value={data.item.id} />
              <Row label="Item Code" value={data.item.code || "—"} />
              <Row label="Category" value={data.item.category || "—"} />
              <Row label="Unit Type" value={data.item.unitType} />
              <Row label="Status" value={data.item.status} />
            </Section>

            {/* 2. Pricing */}
            <Section title="2️⃣ Pricing & Financials" icon="💰">
              <Row
                label="Selling Price"
                value={`${data.item.sellingPrice.toLocaleString()} ETB`}
                highlight
              />
              {canSeeFinance && (
                <>
                  <Row
                    label="Cost Price"
                    value={`${data.item.costPrice?.toLocaleString?.() ?? "—"} ETB`}
                  />
                  <Row
                    label="Avg Cost"
                    value={`${data.item.avgCost?.toLocaleString?.() ?? "—"} ETB`}
                  />
                  <Row
                    label="Profit Margin"
                    value={`${getProfitMargin(data.item)}%`}
                    highlight
                  />
                </>
              )}
            </Section>

            {/* 3. Stock */}
            <Section title="3️⃣ Stock Levels & Status" icon="📊">
              <Row label="Current Stock" value={data.item.stock} highlight />
              <Row label="Reorder Level" value={data.item.reorderLevel} />
              {canSeeFinance && (
                <>
                  <Row
                    label="Total Purchased"
                    value={data.stats.totalPurchased ?? "—"}
                  />
                  <Row label="Total Sold" value={data.stats.totalSold ?? 0} />
                  <Row
                    label="Last Purchased"
                    value={data.stats.lastPurchased || "—"}
                  />
                </>
              )}
              <Row label="Last Sold" value={data.stats.lastSold || "—"} />
            </Section>

            {/* 4. Supplier */}
            {canSeeFinance && (
              <Section title="4️⃣ Supplier & Procurement" icon="🏭">
                <Row label="Supplier ID" value={data.item.supplierId || "—"} />
                <Row
                  label="Supplier Name"
                  value={data.item.supplierName || "—"}
                />
              </Section>
            )}

            {/* 5. Financial Summary */}
            {canSeeFinance && data.stats && (
              <Section title="5️⃣ Financial Summary" icon="💎">
                <Row
                  label="Total Revenue"
                  value={`${data.stats.totalRevenue?.toLocaleString?.() ?? "—"} ETB`}
                />
                <Row
                  label="Total Cost"
                  value={`${data.stats.totalCost?.toLocaleString?.() ?? "—"} ETB`}
                />
                <Row
                  label="Total Profit"
                  value={`${data.stats.totalProfit?.toLocaleString?.() ?? "—"} ETB`}
                  highlight
                />
                <Row
                  label="Profit Margin"
                  value={`${data.stats.profitMargin ?? 0}%`}
                />
              </Section>
            )}

            {/* Recent Purchases */}
            {canSeeFinance && data.stockInLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  📥 Recent Purchases
                </h3>
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-2 py-2 font-semibold">Date</th>
                        <th className="text-right px-2 py-2 font-semibold">Qty</th>
                        <th className="text-right px-2 py-2 font-semibold">Price</th>
                        <th className="text-left px-2 py-2 font-semibold hidden sm:table-cell">
                          By
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stockInLogs.slice(0, 10).map((l) => (
                        <tr key={l.id} className="border-t border-slate-100">
                          <td className="px-2 py-2">{l.date}</td>
                          <td className="px-2 py-2 text-right">+{l.quantity}</td>
                          <td className="px-2 py-2 text-right">
                            {l.buyingPrice.toLocaleString()}
                          </td>
                          <td className="px-2 py-2 hidden sm:table-cell text-slate-500">
                            {l.recordedBy || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Sales */}
            {data.salesLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  🧾 Recent Sales
                </h3>
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-2 py-2 font-semibold">Date</th>
                        <th className="text-left px-2 py-2 font-semibold">
                          Customer
                        </th>
                        <th className="text-right px-2 py-2 font-semibold">Qty</th>
                        <th className="text-right px-2 py-2 font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salesLogs.map((l) => (
                        <tr key={l.salesItemId} className="border-t border-slate-100">
                          <td className="px-2 py-2">{l.saleDate?.slice(0, 10)}</td>
                          <td className="px-2 py-2 truncate">{l.customer}</td>
                          <td className="px-2 py-2 text-right">{l.quantity}</td>
                          <td className="px-2 py-2 text-right">
                            {l.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!canSeeFinance && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                ℹ️ Financial details are visible only to owner and manager.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-2">
        {icon} {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: any;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          highlight
            ? "font-bold text-emerald-600"
            : "font-medium text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
