// src/components/admin/income/IncomeSourceModal.tsx
"use client";

import { useMemo, useState } from "react";
import { IncomeRecord } from "@/lib/income-types";
import IncomeDetailModal from "./IncomeDetailModal";
import {
  fmt,
  escapeHtml,
  printHTML,
  copyToClipboard,
  shareText,
} from "@/lib/print-utils";
import {
  getSourceIcon,
  getSourceLabel,
} from "@/lib/income-categories";

interface Props {
  source: string;                    // e.g. "sales"
  records: IncomeRecord[];           // all records of THIS source only
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEditRecord?: (r: IncomeRecord) => void;
  onDeleteRecord?: (r: IncomeRecord) => void;
  onRefresh?: () => void;
}

export default function IncomeSourceModal({
  source,
  records,
  canEdit,
  canDelete,
  onClose,
  onEditRecord,
  onDeleteRecord,
  onRefresh,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<IncomeRecord | null>(null);

  const totals = useMemo(
    () =>
      records.reduce(
        (a, r) => {
          a.gross += Number(r.totalPrice) || 0;
          a.material += Number(r.materialCost) || 0;
          a.net += Number(r.netIncome) || 0;
          return a;
        },
        { gross: 0, material: 0, net: 0 }
      ),
    [records]
  );

  const label = getSourceLabel(source);
  const icon = getSourceIcon(source);

  function buildText(): string {
    const lines = [
      `🧾 *CLICK COMPUTER CENTER*`,
      `${icon} ${label} — All Records`,
      "───────────────────────",
      `📊 Total Records: ${records.length}`,
      `💵 Gross: ${fmt(totals.gross)} ETB`,
      `📦 Material: ${fmt(totals.material)} ETB`,
      `💎 Net: ${fmt(totals.net)} ETB`,
      "───────────────────────",
    ];
    records.forEach((r, i) => {
      lines.push(
        `${i + 1}. ${r.date.slice(0, 10)} · ${r.incomeCategory}`,
        `   ${fmt(r.totalPrice)} ETB · Net ${fmt(r.netIncome)} ETB`,
        r.description ? `   📝 ${r.description}` : ""
      );
    });
    lines.push("───────────────────────");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    return lines.filter(Boolean).join("\n");
  }

  async function copyAll() {
    const ok = await copyToClipboard(buildText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function shareAll() {
    await shareText(`${label} — Income Summary`, buildText());
  }

  function printAll() {
    const rows = records
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.date.slice(0, 10))}</td>
          <td>${escapeHtml(r.incomeCategory)}</td>
          <td>${escapeHtml(r.description || "—")}</td>
          <td style="text-align:right">${fmt(r.totalPrice)}</td>
          <td style="text-align:right">${fmt(r.materialCost)}</td>
          <td style="text-align:right">${fmt(r.netIncome)}</td>
        </tr>`
      )
      .join("");

    printHTML({
      title: `${label} — All Income Records`,
      bodyHtml: `
        <h2>${escapeHtml(icon)} ${escapeHtml(label)} Summary</h2>
        <div class="kpi">
          <div><div class="label">Records</div><div class="value">${records.length}</div></div>
          <div><div class="label">Gross</div><div class="value">${fmt(totals.gross)}</div></div>
          <div><div class="label">Material</div><div class="value">${fmt(totals.material)}</div></div>
          <div><div class="label">Net</div><div class="value">${fmt(totals.net)}</div></div>
        </div>

        <h2>All Records</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Description</th>
              <th style="text-align:right">Gross</th>
              <th style="text-align:right">Material</th>
              <th style="text-align:right">Net</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL (${records.length} records)</td>
              <td style="text-align:right">${fmt(totals.gross)}</td>
              <td style="text-align:right">${fmt(totals.material)}</td>
              <td style="text-align:right">${fmt(totals.net)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="signature">
          <div>Prepared By</div>
          <div>Approved By</div>
        </div>
      `,
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {icon} {label} — All Records
              </h2>
              <p className="text-xs text-slate-500">
                {records.length} records · Click any row for detail
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={printAll}
                className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                title="Print All"
              >
                🖨 Print
              </button>
              <button
                onClick={copyAll}
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
                onClick={shareAll}
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
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Kpi label="Records" value={String(records.length)} color="slate" />
              <Kpi label="Gross" value={fmt(totals.gross)} color="emerald" />
              <Kpi label="Material" value={fmt(totals.material)} color="red" />
              <Kpi
                label="Net"
                value={fmt(totals.net)}
                color={totals.net >= 0 ? "emerald" : "red"}
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2 font-semibold">Date</th>
                    <th className="text-left px-2 py-2 font-semibold">Category</th>
                    <th className="text-left px-2 py-2 font-semibold hidden md:table-cell">
                      Description
                    </th>
                    <th className="text-right px-2 py-2 font-semibold">Gross</th>
                    <th className="text-right px-2 py-2 font-semibold">Net</th>
                    <th className="text-right px-2 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-emerald-50 cursor-pointer"
                      onClick={() => setDetail(r)}
                    >
                      <td className="px-2 py-1.5">{r.date.slice(0, 10)}</td>
                      <td className="px-2 py-1.5">{r.incomeCategory}</td>
                      <td className="px-2 py-1.5 hidden md:table-cell truncate max-w-xs">
                        {r.description || "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-emerald-600">
                        {fmt(r.totalPrice)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right font-semibold ${
                          r.netIncome >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {fmt(r.netIncome)}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetail(r);
                          }}
                          className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50 sticky bottom-0">
                  <tr className="font-bold">
                    <td colSpan={3} className="px-2 py-2">
                      TOTAL ({records.length})
                    </td>
                    <td className="px-2 py-2 text-right">{fmt(totals.gross)}</td>
                    <td className="px-2 py-2 text-right">{fmt(totals.net)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Detail Modal */}
      {detail && (
        <IncomeDetailModal
          record={detail}
          allRecords={records}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={() => {
            onEditRecord?.(detail);
            setDetail(null);
          }}
          onDelete={() => {
            onDeleteRecord?.(detail);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </>
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
  const cls = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }[color];
  return (
    <div className={`p-2.5 rounded-lg border ${cls} text-center`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70 font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}
