// src/app/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊", roles: ["owner", "manager", "staff"] },
  { href: "/admin/inventory", label: "Inventory", icon: "📦", roles: ["owner", "manager", "staff"] },
  { href: "/admin/sales", label: "Sales / POS", icon: "🧾", roles: ["owner", "manager", "staff"] },
  { href: "/admin/customers", label: "Customers", icon: "🧑", roles: ["owner", "manager", "staff"] },
  { href: "/admin/suppliers", label: "Suppliers", icon: "🏭", roles: ["owner", "manager"] },
  { href: "/admin/reports", label: "Reports", icon: "📈", roles: ["owner", "manager"] },
  { href: "/admin/export", label: "Export Center", icon: "📤", roles: ["owner", "manager"] },
  { href: "/admin/announcements", label: "Announcements", icon: "📢", roles: ["owner", "manager", "staff"] },
  { href: "/admin/staff", label: "Staff & Badges", icon: "🏅", roles: ["owner", "manager"] },
];

export default function AdminShell({
  children,
  user,
  role,
}: {
  children: React.ReactNode;
  user: { name?: string | null; image?: string | null };
  role: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initials = (user.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-white">Click Computer</p>
            <p className="text-xs text-slate-400">Enterprise Console</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.filter((n) => n.roles.includes(role.toLowerCase())).map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-orange-500 text-white"
                    : "hover:bg-white/10 text-slate-200"
                }`}
              >
                <span className="text-base">{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section with Settings and User Profile */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname?.startsWith("/admin/settings")
                ? "bg-orange-500 text-white"
                : "hover:bg-white/10 text-slate-200"
            }`}
          >
            <span className="text-base">⚙️</span> Settings
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 pt-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user.name || "User"}
              </p>
              <p className="text-slate-400 text-xs capitalize">{role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-white/5 transition"
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            ☰
          </button>
          <p className="font-bold text-slate-900">Click Computer</p>
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
