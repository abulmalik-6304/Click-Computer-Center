'use client';
import { useEffect, useMemo, useState } from 'react';
import { SaleRecord } from '@/lib/financial-engine';

export default function SalesDataCenter() {
  const [rows, setRows] = useState<SaleRecord[]>([]);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortKey, setSortKey] = useState<keyof SaleRecord>('date');
  const [dir, setDir] = useState<'asc'|'desc'>('desc');

  useEffect(() => {
    fetch('/api/sheets?name=Sales').then(r => r.json()).then(setRows);
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(r =>
        r.productName?.toLowerCase().includes(lq) ||
        r.staffId?.toLowerCase().includes(lq) ||
        r.id?.toLowerCase().includes(lq)
      );
    }
    if (from) out = out.filter(r => r.date >= from);
    if (to)   out = out.filter(r => r.date <= to + 'T23:59:59');
    return [...out].sort((a, b) => {
      const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? '';
      return (av < bv ? -1 : av > bv ? 1 : 0) * (dir === 'asc' ? 1 : -1);
    });
  }, [rows, q, from, to, sortKey, dir]);

  async function exportFile(kind: 'pdf' | 'xlsx' | 'csv') {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: filtered, format: kind }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${Date.now()}.${kind === 'xlsx' ? 'xlsx' : kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sales History / Data Center</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-2 bg-slate-200 rounded-lg text-sm font-medium">🖨 Print</button>
          <button onClick={() => exportFile('pdf')} className="px-3 py-2 bg-slate-200 rounded-lg text-sm font-medium">📄 PDF</button>
          <button onClick={() => exportFile('xlsx')} className="px-3 py-2 bg-slate-200 rounded-lg text-sm font-medium">📊 Excel</button>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(filtered, null, 2))}
            className="px-3 py-2 bg-slate-200 rounded-lg text-sm font-medium"
          >📋 Copy</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <input placeholder="Search product, staff, id…" value={q} onChange={e => setQ(e.target.value)}
               className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
               className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
               className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        <select value={sortKey} onChange={e => setSortKey(e.target.value as any)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900">
          <option value="date">Sort: Date</option>
          <option value="productName">Sort: Product</option>
          <option value="quantity">Sort: Qty</option>
          <option value="unitPrice">Sort: Price</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {['Date','Product','Qty','Unit Price','Cost','Line Profit','Staff'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const profit = ((r.unitPrice - r.unitCost) * r.quantity).toFixed(2);
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{r.date.slice(0,10)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.productName}</td>
                  <td className="px-4 py-3">{r.quantity}</td>
                  <td className="px-4 py-3">{r.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">{r.unitCost.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{profit}</td>
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
