// src/components/admin/dashboard/ActivityFeed.tsx
"use client";

import Link from "next/link";

interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  customer: string;
  staff: string;
  amount: number;
}

interface Announcement {
  id: string;
  title: string;
  date: string;
}

export default function ActivityFeed({
  recentSales,
  recentAnnouncements,
}: {
  recentSales: Sale[];
  recentAnnouncements: Announcement[];
}) {
  const items = [
    ...recentSales.map((s) => ({
      type: "sale" as const,
      id: s.id,
      date: s.date,
      title: `New sale · ${s.invoiceNo}`,
      detail: `${s.customer} · ${s.amount.toLocaleString()} ETB`,
    })),
    ...recentAnnouncements.map((a) => ({
      type: "announcement" as const,
      id: a.id,
      date: a.date,
      title: `Announcement · ${a.title}`,
      detail: "",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 mb-3">⚡ Activity</h2>
        <p className="text-sm text-slate-500 text-center py-4">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-900">⚡ Activity</h2>
        <span className="text-xs text-slate-400">{items.length} recent</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {items.map((it) => (
          <div
            key={it.type + it.id}
            className="p-4 hover:bg-slate-50 transition flex items-start gap-3"
          >
            <div className="text-lg flex-shrink-0">
              {it.type === "sale" ? "💰" : "📢"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {it.title}
              </p>
              {it.detail && (
                <p className="text-xs text-slate-500 truncate">{it.detail}</p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(it.date).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
