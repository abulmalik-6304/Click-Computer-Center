"use client";

import { useState } from "react";

export default function ExportCenterPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");

  async function handleExport(kind: string, title: string) {
    setLoading(kind);
    try {
      // ለጊዜው ናሙና ዳታዎችን እናዘጋጃለን (ከ Google Sheet ጋር በቀላሉ ይያያዛል)
      const mockColumns = [
        { key: "id", label: "ID", width: 60 },
        { key: "name", label: "Item / Name", width: 150 },
        { key: "category", label: "Category", width: 100 },
        { key: "amount", label: "Amount / Price", width: 100, align: "right" as const },
        { key: "date", label: "Date", width: 100 },
      ];

      const mockRows = [
        { id: "001", name: "Dell OptiPlex 7070 i7", category: "Computers", amount: 45000, date: "2026-10-01" },
        { id: "002", name: "HP ProBook G6", category: "Laptops", amount: 38000, date: "2026-10-05" },
        { id: "003", name: "Logitech Wireless Mouse", category: "Accessories", amount: 1200, date: "2026-10-10" },
        { id: "004", name: "Samsung 24\" Monitor", category: "Displays", amount: 9500, date: "2026-10-15" },
      ];

      const payload = {
        kind,
        title,
        format,
        generatedAt: new Date().toISOString(),
        columns: mockColumns,
        rows: mockRows,
      };

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📤 Export Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Download enterprise reports, inventory lists, and sales data securely.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setFormat("xlsx")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              format === "xlsx" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            📊 Excel (XLSX)
          </button>
          <button
            onClick={() => setFormat("csv")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              format === "csv" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            📄 CSV
          </button>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExportCard
          title="Inventory Stock Report"
          description="Complete list of computers, hardware parts, accessories, and stock levels."
          icon="📦"
          loading={loading === "inventory"}
          onExport={() => handleExport("inventory", "Click Computer Center - Inventory Stock")}
        />
        <ExportCard
          title="Sales & POS Transactions"
          description="Detailed breakdown of daily sales, customer purchases, and revenue totals."
          icon="🧾"
          loading={loading === "sales"}
          onExport={() => handleExport("sales", "Click Computer Center - Sales & POS Report")}
        />
        <ExportCard
          title="Staff & Performance Log"
          description="Staff directory, roles, activity status, and awarded badges summary."
          icon="🏅"
          loading={loading === "staff"}
          onExport={() => handleExport("staff", "Click Computer Center - Staff Directory")}
        />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  icon,
  loading,
  onExport,
}: {
  title: string;
  description: string;
  icon: string;
  loading: boolean;
  onExport: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="space-y-3">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onExport}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Generating..." : "📥 Download Report"}
        </button>
      </div>
    </div>
  );
}
