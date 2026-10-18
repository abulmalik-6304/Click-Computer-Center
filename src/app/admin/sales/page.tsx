"use client";
import { useEffect, useMemo, useState } from "react";

interface SaleRow {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  staffId: string;
}

export default function SalesDataCenter() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch("/api/sheets?name=Sales")
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (r) =>
          r.productName?.toLowerCase().includes(lq) ||
          r.staffId?.toLowerCase().includes(lq) ||
          r.id?.toLowerCase().includes(lq)
      );
    }
    if (from) out = out.filter((r) => r.date >= from);
    if (to) out = out.filter((r) => r.date <= to + "T23:59:59");
    return out;
  }, [rows, q, from, to]);

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Sales History / Data Center</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(filtered, null, 2))}
          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium">
          📋 Copy
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {["Date", "Product", "Qty", "Unit Price", "Cost", "Profit", "Staff"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No sales records found.</td></tr>
            )}
            {filtered.map((r) => {
              const profit = (r.unitPrice - r.unitCost) * r.quantity;
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{r.date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.productName}</td>
                  <td className="px-4 py-3">{r.quantity}</td>
                  <td className="px-4 py-3">{r.unitPrice?.toFixed(2)}</td>
                  <td className="px-4 py-3">{r.unitCost?.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{profit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.staffId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
