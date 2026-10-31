// src/app/admin/settings/SigninLogClient.tsx
"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  date: string;
  email: string;
  name: string;
  role: string;
  status: string;
  ip: string;
  userAgent: string;
}

export default function SigninLogClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signin-log");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        return;
      }
      setLogs(data.logs || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">🔐 Sign-In History</h3>
          <p className="text-sm text-slate-500 mt-1">
            Recent login attempts ({logs.length})
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50"
        >
          {loading ? "⟳" : "🔄"} Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {loading ? (
        <p className="p-6 text-sm text-slate-500 text-center">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="p-6 text-sm text-slate-500 text-center">No sign-in history yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-3 font-semibold">Date</th>
                <th className="text-left px-3 py-3 font-semibold">Email</th>
                <th className="text-left px-3 py-3 font-semibold">Role</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {new Date(log.date).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-900">{log.email}</td>
                  <td className="px-3 py-2 capitalize text-slate-700">{log.role}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs hidden md:table-cell">
                    {log.ip || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
