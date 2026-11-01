// src/components/admin/sales/SalesActivityPanel.tsx
"use client";

import { useEffect, useState } from "react";
import {
  SalesActivityLog,
  SALES_ACTION_COLORS,
  SALES_ACTION_ICONS,
} from "@/lib/sales-activity";

export default function SalesActivityPanel() {
  const [logs, setLogs] = useState<SalesActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sales/activity?limit=100");
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed to load");
        return;
      }
      setLogs(d.logs || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = logs.filter((l) => filter === "all" || l.action === filter);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-slate-900">📝 Sales Activity Log</h2>
          <p className="text-xs text-slate-500 mt-1">
            Who edited or deleted sales — for owner & manager
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50"
        >
          {loading ? "⟳" : "🔄"} Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-1">
        {[
          { key: "all", label: "All" },
          { key: "create", label: "➕ Create" },
          { key: "edit", label: "✏️ Edit" },
          { key: "delete", label: "🗑 Delete" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
              filter === f.key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {loading ? (
        <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">
          No activity yet
        </p>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filtered.map((log) => (
            <div key={log.id} className="p-3 hover:bg-slate-50">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">
                  {SALES_ACTION_ICONS[log.action] || "📝"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        SALES_ACTION_COLORS[log.action] || "bg-slate-100"
                      }`}
                    >
                      {log.action}
                    </span>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {log.invoiceNo || log.salesId}
                    </p>
                  </div>
                  {log.customerName && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      👤 {log.customerName}
                    </p>
                  )}
                  {log.details && (
                    <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                  )}
                  {(log.oldValue || log.newValue) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {log.oldValue && (
                        <span className="line-through">{log.oldValue}</span>
                      )}
                      {log.oldValue && log.newValue && " → "}
                      {log.newValue && (
                        <span className="text-emerald-600">{log.newValue}</span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    By {log.performedBy || "—"} ({log.role}) ·{" "}
                    {new Date(log.date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
