// src/components/admin/dashboard/OnlineStaff.tsx
"use client";

import { useEffect, useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface OnlineStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  photo: string;
  lastSeen: string;
  isOnline: boolean;
  lastSeenLabel: string;
  status: string;
}

interface Props {
  initialOnline?: OnlineStaffMember[];
  initialOffline?: OnlineStaffMember[];
}

export default function OnlineStaff({
  initialOnline = [],
  initialOffline = [],
}: Props) {
  const [online, setOnline] = useState(initialOnline);
  const [offline, setOffline] = useState(initialOffline);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"online" | "all">("online");

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/online", { cache: "no-store" });
      const data = await res.json();
      if (data.online) setOnline(data.online);
      if (data.offline) setOffline(data.offline);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  const displayList = tab === "online" ? online : [...online, ...offline];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          👥 Online Staff
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            {online.length} online
          </span>
        </h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-900 disabled:opacity-50"
        >
          {loading ? "⟳" : "🔄"} Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3 border-b border-slate-100 bg-slate-50">
        <button
          onClick={() => setTab("online")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            tab === "online"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          🟢 Online ({online.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            tab === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          All ({online.length + offline.length})
        </button>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-3xl mb-2">😴</p>
          <p className="text-sm text-slate-500">
            {tab === "online" ? "No one is online right now" : "No staff members"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {displayList.map((s) => (
            <div
              key={s.id}
              className="p-3 hover:bg-slate-50 transition flex items-center gap-3"
            >
              <div className="relative">
                <img
                  src={formatDriveUrl(s.photo)}
                  alt={s.name}
                  className="w-10 h-10 rounded-full object-cover bg-slate-100 ring-2 ring-slate-200"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src = "/placeholder.svg")
                  }
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                    s.isOnline ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {s.name || s.email}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {s.role} · {s.isOnline ? "🟢 Online now" : `⚪ ${s.lastSeenLabel}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Auto-refresh every 30s · Online = active in last 5 min
        </p>
      </div>
    </div>
  );
}
