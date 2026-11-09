// src/components/employee/EmployeeSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    canRegisterInventory: boolean;  // 🆕
    canViewAnnouncements: boolean;
    canCreateAnnouncements: boolean;
  };
}

export default function EmployeeSidebar({ user, permissions }: Props) {
  const pathname = usePathname();

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
      show: permissions.canRegisterSale,
    },
    {
      href: "/employee/income/new",
      label: "New Income",
      icon: "💰",
      show: permissions.canRegisterIncome,
    },
    {
      href: "/employee/inventory/new",   // 🆕
      label: "New Inventory",
      icon: "📦",
      show: permissions.canRegisterInventory,
    },
    {
      href: "/employee/announcements",
      label: "Announcements",
      icon: "📢",
      show: permissions.canViewAnnouncements,
    },
    {
      href: "/employee/announcements/new",   // 🆕
      label: "New Announcement",
      icon: "✉️",
      show: permissions.canCreateAnnouncements,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="p-4 border-b border-slate-200">
        <h1 className="font-bold text-emerald-700 text-lg">💼 Click CC</h1>
        <p className="text-xs text-slate-500">Employee Portal</p>
      </div>

      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        {user.photo ? (
          <img
            src={user.photo}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = "/placeholder.svg")
            }
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            {user.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {user.name}
          </p>
          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
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

      <div className="p-3 border-t border-slate-200">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
        >
          🚪 Logout
        </Link>
      </div>
    </aside>
  );
}
