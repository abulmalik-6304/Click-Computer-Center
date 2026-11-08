// src/components/admin/income/IncomeDetailModal.tsx
"use client";

import { useState } from "react";
import { IncomeRecord } from "@/lib/income-types";

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

interface Props {
  record: IncomeRecord;
  allRecords: IncomeRecord[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function IncomeDetailModal({
  record,
  allRecords,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  // ✅ Filter records with the same source
  const sameSource = allRecords.filter(
    (r) => r.incomeSource === record.incomeSource
  );
  const sourceTotal = sameSource.reduce((s, r) => s + r.totalPrice, 0);
  const sourceNet = sameSource.reduce((s, r) => s + r.netIncome, 0);
  const sourceMaterial = sameSource.reduce((s, r) => s + r.materialCost, 0);

  function buildText(): string {
    const lines = [
      "🧾 *CLICK COMPUTER CENTER*",
      `💰 Income Detail · ${record.incomeSource}`,
      "───────────────────────",
      `📅 Date: ${record.date.slice(0, 10)}`,
      `📂 Category: ${record.incomeCategory}`,
      `👤 Recorded By: ${record.recordedBy || "—"}`,
      "───────────────────────",
      `Price: ${fmt(record.price)} × ${record.quantity}`,
      `*Total: ${fmt(record.totalPrice)} ETB*`,
      "",
      `📦 Material Cost: ${fmt(record.materialCost)} ETB`,
      `💎 *Net Income: ${fmt(record.netIncome)} ETB*`,
      "",
      `📝 ${record.description || "No description"}`,
      "───────────────────────",
      `📊 *${record.incomeSource} — Summary*`,
      `• Records: ${sameSource.length}`,
      `• Gross: ${fmt(sourceTotal)} ETB`,
      `• Material: ${fmt(sourceMaterial)} ETB`,
      `• Net: ${fmt(sourceNet)} ETB`,
      "───────────────────────",
      `Generated: ${new Date().toLocaleString()}`,
    ];
    return lines.join("\n");
  }

  async function copyDetail() {
    const text = buildText();
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

  async function shareDetail() {
    const text = buildText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${record.incomeSource} — Income Detail`,
          text,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await copyDetail();
      alert("Share not supported — copied to clipboard");
    }
  }

  function printDetail() {
    const materials = (() => {
      try {
        return JSON.parse(record.materialsJson || "[]");
      } catch {
        return [];
      }
    })();

    const materialsHtml = materials
      .map(
        (m: any) => `
        <tr>
          <td>${m.itemName}</td>
          <td style="text-align:right">${fmt(m.usedQty)}</td>
          <td style="text-align:right">${fmt(m.costPrice)}</td>
          <td style="text-align:right">${fmt(m.packSize)}</td>
          <td style="text-align:right">${fmt(m.materialCost)}</td>
        </tr>
      `
      )
      .join("");

    const sameSourceHtml = sameSource
      .map(
        (r) => `
        <tr>
          <td>${r.date.slice(0, 10)}</td>
          <td>${r.incomeCategory}</td>
          <td style="text-align:right">${fmt(r.totalPrice)}</td>
          <td style="text-align:right">${fmt(r.materialCost)}</td>
          <td style="text-align:right">${fmt(r.netIncome)}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html><head><title>${record.incomeSource} — Detail</title>
      <style>
        body{font-family:Arial;padding:24px;max-width:800px;margin:0 auto;color:#0f172a}
        h1{font-size:20px;margin:0 0 4px}
        h2{font-size:14px;margin:16px 0 8px;border-bottom:2px solid #10b981;padding-bottom:2px}
        .small{font-size:12px;color:#666}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin:8px 0}
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
        <p class="small">${record.incomeSource} — Income Detail · ${new Date().toLocaleString()}</p>

        <h2>Income Info</h2>
        <div class="info">
          <div><strong>Date:</strong> ${record.date.slice(0, 10)}</div>
          <div><strong>Source:</strong> ${record.incomeSource}</div>
          <div><strong>Category:</strong> ${record.incomeCategory}</div>
          <div><strong>Recorded By:</strong> ${record.recordedBy || "—"}</div>
        </div>

        <h2>Financials</h2>
        <div class="kpi">
          <div><div class="label">Price</div><div class="value">${fmt(record.price)}</div></div>
          <div><div class="label">Quantity</div><div class="value">${record.quantity}</div></div>
          <div><div class="label">Total</div><div class="value">${fmt(record.totalPrice)}</div></div>
          <div><div class="label">Net</div><div class="value">${fmt(record.netIncome)}</div></div>
        </div>

        ${
          materials.length > 0
            ? `
              <h2>Materials Used</h2>
              <table>
                <thead><tr><th>Item</th><th style="text-align:right">Used Qty</th><th style="text-align:right">Cost Price</th><th style="text-align:right">Pack Size</th><th style="text-align:right">Material Cost</th></tr></thead>
                <tbody>${materialsHtml}</tbody>
              </table>
            `
            : ""
        }

        <h2>${record.incomeSource} — All Records (${sameSource.length})</h2>
        <table>
          <thead><tr><th>Date</th><th>Category</th><th style="text-align:right">Gross</th><th style="text-align:right">Material</th><th style="text-align:right">Net</th></tr></thead>
          <tbody>${sameSourceHtml}</tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#f0fdf4">
              <td colspan="2">TOTAL</td>
              <td style="text-align:right">${fmt(sourceTotal)}</td>
              <td style="text-align:right">${fmt(sourceMaterial)}</td>
              <td style="text-align:right">${fmt(sourceNet)}</td>
            </tr>
          </tfoot>
        </table>

        <p class="small"><strong>Description:</strong> ${record.description || "—"}</p>
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
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {record.incomeSource}
            </h2>
            <p className="text-xs text-slate-500">
              {record.date.slice(0, 10)} · {record.incomeCategory}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={printDetail}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              title="Print"
            >
              🖨
            </button>
            <button
              onClick={copyDetail}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="Copy"
            >
              {copied ? "✅" : "📋"}
            </button>
            <button
              onClick={shareDetail}
              className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
              title="Share"
            >
              🔗
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Kpi label="Price" value={fmt(record.price)} color="slate" />
            <Kpi label="Qty" value={String(record.quantity)} color="slate" />
            <Kpi label="Total" value={fmt(record.totalPrice)} color="emerald" />
            <Kpi
              label="Net"
              value={fmt(record.netIncome)}
              color={record.netIncome >= 0 ? "emerald" : "red"}
            />
          </div>

          {/* Materials */}
          {(() => {
            try {
              const materials = JSON.parse(record.materialsJson || "[]");
              if (!Array.isArray(materials) || materials.length === 0) return null;
              return (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    📦 Materials Used ({materials.length})
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-2 py-2 font-semibold">Item</th>
                          <th className="text-right px-2 py-2 font-semibold">Used</th>
                          <th className="text-right px-2 py-2 font-semibold">Cost</th>
                          <th className="text-right px-2 py-2 font-semibold">Pack</th>
                          <th className="text-right px-2 py-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-2 py-1.5 font-medium">{m.itemName}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(m.usedQty)}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(m.costPrice)}</td>
                            <td className="px-2 py-1.5 text-right">{fmt(m.packSize)}</td>
                            <td className="px-2 py-1.5 text-right font-semibold text-red-600">
                              −{fmt(m.materialCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            } catch {
              return null;
            }
          })()}

          {/* Description */}
          {record.description && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-900">{record.description}</p>
            </div>
          )}

          {/* Source Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              📊 {record.incomeSource} — All Records ({sameSource.length})
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Kpi label="Gross" value={fmt(sourceTotal)} color="emerald" />
              <Kpi label="Material" value={fmt(sourceMaterial)} color="red" />
              <Kpi
                label="Net"
                value={fmt(sourceNet)}
                color={sourceNet >= 0 ? "emerald" : "red"}
              />
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2 font-semibold">Date</th>
                    <th className="text-left px-2 py-2 font-semibold">Category</th>
                    <th className="text-right px-2 py-2 font-semibold">Gross</th>
                    <th className="text-right px-2 py-2 font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {sameSource.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-1.5">{r.date.slice(0, 10)}</td>
                      <td
                        className={`px-2 py-1.5 ${
                          r.id === record.id ? "font-bold text-emerald-600" : ""
                        }`}
                      >
                        {r.incomeCategory}
                      </td>
                      <td className="px-2 py-1.5 text-right">{fmt(r.totalPrice)}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-semibold ${
                          r.netIncome >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {fmt(r.netIncome)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50 sticky bottom-0">
                  <tr className="font-bold border-t-2 border-emerald-200">
                    <td colSpan={2} className="px-2 py-2">
                      TOTAL ({sameSource.length})
                    </td>
                    <td className="px-2 py-2 text-right">{fmt(sourceTotal)}</td>
                    <td className="px-2 py-2 text-right">{fmt(sourceNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Meta */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Recorded By:</span>{" "}
              <span className="font-semibold text-slate-900">
                {record.recordedBy || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Record ID:</span>{" "}
              <span className="font-mono text-slate-700">{record.id.slice(0, 8)}</span>
            </div>
          </div>

          {/* Actions */}
          {(canEdit || canDelete) && (
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  ✏️ Edit Record
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  🗑️ Delete Record
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "slate" | "emerald" | "red";
}) {
  const colorMap = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className={`p-2.5 rounded-lg border ${colorMap[color]} text-center`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70 font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}
