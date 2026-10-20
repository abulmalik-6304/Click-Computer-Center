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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sheets?name=Sales")
      .then((r) => r.json())
      .then((d) => {
        const rawData = Array.isArray(d) ? d : [];
        // ከ Google Sheets የሚመጡትን የተለያዩ የሰል ስሞች እና የቁጥር አይነቶች በትክክል ማስተካከል
        const formatted: SaleRow[] = rawData.map((item: any, index: number) => ({
          id: String(item.id || item.ID || index + 1),
          date: String(item.date || item.Date || ""),
          productName: String(item.productName || item.Product_Name || item.Item_Name || "Unknown Product"),
          quantity: Number(item.quantity || item.Quantity || 1),
          unitPrice: Number(item.unitPrice || item.Unit_Price || 0),
          unitCost: Number(item.unitCost || item.Unit_Cost || 0),
          staffId: String(item.staffId || item.Staff_ID || item.Recorded_By || "Admin"),
        }));
        setRows(formatted);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
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

  // ጠቅላላ ድምር (Total Revenue & Profit) ማሰላት
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        const rev = r.unitPrice * r.quantity;
        const cost = r.unitCost * r.quantity;
        const prof = rev - cost;
        return {
          revenue: acc.revenue + rev,
          profit: acc.profit + prof,
        };
      },
      { revenue: 0, profit: 0 }
    );
  }, [filtered]);

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History / Data Center</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and filter all sales records from Google Sheets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-sm">
            <span className="text-emerald-800 font-semibold">Total Revenue: </span>
            <span className="font-bold text-emerald-900">{totals.revenue.toFixed(2)} ETB</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-sm">
            <span className="text-blue-800 font-semibold">Total Profit: </span>
            <span className="font-bold text-blue-900">{totals.profit.toFixed(2)} ETB</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input 
          placeholder="Search product, staff, ID…" 
          value={q} 
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" 
        />
        <input 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" 
        />
        <input 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" 
        />
        <button 
          onClick={() => navigator.clipboard.writeText(JSON.stringify(filtered, null, 2))}
          className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
        >
          📋 Copy Filtered JSON
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {["Date", "Product", "Qty", "Unit Price (ETB)", "Cost (ETB)", "Profit (ETB)", "Staff"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading sales records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No sales records found.</td></tr>
            ) : (
              filtered.map((r, idx) => {
                const profit = (Number(r.unitPrice) - Number(r.unitCost)) * Number(r.quantity);
                return (
                  <tr key={r.id || idx} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-700">{r.date ? r.date.slice(0, 10) : "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.productName}</td>
                    <td className="px-4 py-3">{r.quantity}</td>
                    <td className="px-4 py-3">{Number(r.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3">{Number(r.unitCost).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{profit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.staffId}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
