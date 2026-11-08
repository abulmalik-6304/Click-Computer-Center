// src/components/admin/income/ActivityLogModal.tsx
"use client";

import { useMemo, useState } from "react";
import {
  getActivityLog,
  deleteActivityLogEntry,
  clearActivityLog,
} from "@/lib/activity-log";
import { ActivityLogEntry } from "@/lib/activity-log-types";

interface Props {
  onClose: () => void;
  onChanged?: () => void; // refresh callback
}

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  "income:create": { label: "Income Added", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "➕" },
  "income:update": { label: "Income Updated", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "✏️" },
  "income:delete": { label: "Income Deleted", color: "bg-red-50 text-red-700 border-red-200", icon: "🗑" },
  "income:print": { label: "Income Printed", color: "bg-slate-50 text-slate-700 border-slate-200", icon: "🖨" },
  "income:export": { label: "Income Exported", color: "bg-orange-50 text-orange-700 border-orange-200", icon: "📥" },
  "expense:create": { label: "Expense Added", color: "bg-red-50 text-red-700 border-red-200", icon: "➕" },
  "expense:update": { label: "Expense Updated", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "✏️" },
  "expense:delete": { label: "Expense Deleted", color: "bg-red-50 text-red-700 border-red-200", icon: "🗑" },
  login: { label: "Login", color: "bg-slate-50 text-slate-700 border-slate-200", icon: "🔐" },
  logout: { label: "Logout", color: "bg-slate-50 text-slate-700 border-slate-200", icon: "🚪" },
};

export default function ActivityLogModal({ onClose, onChanged }: Props) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>(() => getActivityLog());
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const matchQ =
        !q ||
        e.userName.toLowerCase().includes(q) ||
        e.targetLabel?.toLowerCase().includes(q) ||
        e.details?.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q);
      const matchModule = moduleFilter === "all" || e.module === moduleFilter;
      return matchQ && matchModule;
    });
  }, [entries, search, moduleFilter]);

  function handleDelete(id: string) {
    if (!confirm("Delete this log entry?")) return;
    deleteActivityLogEntry(id);
    setEntries(getActivityLog());
    onChanged?.();
  }

  function handleClearAll() {
    if (!confirm(`Delete ALL ${entries.length} log entries? This cannot be undone.`)) return;
    clearActivityLog();
    setEntries([]);
    setConfirmClear(false);
    onChanged?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">📝 Activity Log</h2>
            <p className="text-xs text-slate-500">
              {entries.length} total · {filtered.length} shown
            </p>
          </div>
          <div className="flex gap-1">
            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg"
                title="Clear all"
              >
                🗑 Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="🔍 Search user, target, action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All Modules</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="auth">Auth</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="p-12 text-center text-sm text-slate-500">
              No activity entries found.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((e) => {
                const meta = ACTION_META[e.action] || {
                  label: e.action,
                  color: "bg-slate-50 text-slate-700 border-slate-200",
                  icon: "•",
                };
                return (
                  <li
                    key={e.id}
                    className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}
                          >
                            {meta.icon} {meta.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(e.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 mt-1">
                          <strong>{e.userName}</strong>
                          {e.userRole && (
                            <span className="text-xs text-slate-500 ml-1">
                              ({e.userRole})
                            </span>
                          )}
                          {e.targetLabel && (
                            <>
                              {" · "}
                              <span className="text-slate-700">
                                {e.targetLabel}
                              </span>
                            </>
                          )}
                        </p>
                        {e.details && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            {e.details}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded flex-shrink-0"
                        title="Delete entry"
                      >
                        🗑
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
