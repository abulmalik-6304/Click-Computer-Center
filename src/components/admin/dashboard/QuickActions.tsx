// src/components/admin/dashboard/QuickActions.tsx
"use client";

import Link from "next/link";

const ACTIONS = [
  { href: "/admin/sales", label: "New Sale", icon: "🧾", color: "bg-emerald-500 hover:bg-emerald-600" },
  { href: "/admin/inventory", label: "Add Item", icon: "📦", color: "bg-orange-500 hover:bg-orange-600" },
  { href: "/admin/export", label: "Export", icon: "📤", color: "bg-slate-700 hover:bg-slate-800" },
  { href: "/admin/announcements", label: "Announce", icon: "📢", color: "bg-blue-500 hover:bg-blue-600" },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="font-bold text-slate-900 mb-3">⚡ Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`${a.color} text-white rounded-xl py-4 flex flex-col items-center justify-center gap-1 transition shadow-sm`}
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
