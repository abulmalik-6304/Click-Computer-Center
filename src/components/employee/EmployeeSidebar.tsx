// src/components/employee/EmployeeSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  user: {
    name: string;
    email: string;
    role: string;
    photo?: string | null;
  };
  permissions: {
    canRegisterSale: boolean;
    canRegisterIncome: boolean;
    canRegisterInventory: boolean;
    canViewAnnouncements: boolean;
    canCreateAnnouncements: boolean;
  };
}

export default function EmployeeSidebar({ user, permissions }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      href: "/employee/dashboard",
      label: "Dashboard",
      icon: "🏠",
      show: true,
    },
    {
      href: "/employee/sale/new",
      label: "New Sale",
      icon: "🛒",
      show: permissions.canRegisterSale === true,
    },
    {
      href: "/employee/income/new",
      label: "New Income",
      icon: "💰",
      show: permissions.canRegisterIncome === true,
    },
    {
      href: "/employee/inventory/new",
      label: "New Inventory",
      icon: "📦",
      show: permissions.canRegisterInventory === true,
    },
    {
      href: "/employee/announcements",
      label: "Announcements",
      icon: "📢",
      show: permissions.canViewAnnouncements === true,
    },
    {
      href: "/admin/announcements",
      label: "Create Announcement",
      icon: "✉️",
      show:
        permissions.canCreateAnnouncements === true &&
        permissions.canViewAnnouncements === true,
    },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  // ✅ Get initials
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE TOP BAR — ስም እና Logout ይታያሉ
      ═══════════════════════════════════════════════════════════════ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-16 px-3 flex items-center justify-between gap-2 shadow-sm">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-base font-bold text-emerald-700 whitespace-nowrap">
            💼 Click CC
          </span>
        </div>

        {/* Right: Name + Avatar + Logout */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Name (truncated) */}
          <div className="text-right min-w-0 max-w-[100px]">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user.name.split(" ")[0]}
            </p>
            <p className="text-[10px] text-slate-500 capitalize truncate">
              {user.role}
            </p>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs overflow-hidden flex-shrink-0">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/placeholder.svg")
                }
              />
            ) : (
              initials
            )}
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
            aria-label="Logout"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE BACKDROP
      ═══════════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          w-64 bg-white border-r border-slate-200
          h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-emerald-700 text-lg">💼 Click CC</h1>
            <p className="text-xs text-slate-500">Employee Portal</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-900 text-xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              onError={(e) =>
                ((e.target as HTMLImageElement).src = "/placeholder.svg")
              }
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 capitalize truncate">
              {user.role}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
