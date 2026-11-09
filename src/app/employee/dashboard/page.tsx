// src/app/employee/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import Link from "next/link";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";
import {
  isEmployeeRole,
  parseEmployeePermissions,
} from "@/lib/employee-permissions";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const EMPLOYEE_PERMS_SHEET = "Employee_Permissions_TBL";

export default async function EmployeeDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (!isEmployeeRole(role)) redirect("/admin/dashboard");

  const name = session.user?.name || "Employee";
  const email = String(session.user?.email || "").toLowerCase().trim();
  const photo = session.user?.image || null;

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD EMPLOYEE PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  let permissions = parseEmployeePermissions(email, {}); // defaults
  try {
    const permSheet = await getSheet(EMPLOYEE_PERMS_SHEET);
    const permRows = await permSheet.getRows();
    const myPerm = permRows.find((r) => {
      const o = r.toObject() as any;
      return (
        String(o.Employee_Email || "").toLowerCase() === email
      );
    });
    if (myPerm) {
      permissions = parseEmployeePermissions(email, myPerm.toObject());
    }
  } catch (e) {
    console.warn("Employee permissions load failed:", e);
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD STATS
  // ═══════════════════════════════════════════════════════════════
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let recentSales: any[] = [];

  try {
    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const mySales = salesRows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Sales_ID || ""),
          date: String(o.Date || ""),
          recordedBy: String(o.Recorded_By || ""),
          total: Number(o.Total_Amount || 0),
        };
      })
      .filter(
        (s) =>
          s.recordedBy.toLowerCase() === email ||
          s.recordedBy.toLowerCase() === name.toLowerCase()
      );

    for (const s of mySales) {
      const d = new Date(s.date);
      if (d >= today) todayCount++;
      if (d >= weekAgo) weekCount++;
      if (d >= monthAgo) monthCount++;
    }

    recentSales = mySales
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  } catch {
    // ignore
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD ANNOUNCEMENTS (filtered for this user)
  // ═══════════════════════════════════════════════════════════════
  let announcements: any[] = [];
  let unreadCount = 0;
  try {
    const annSheet = await getSheet(SHEETS.ANNOUNCEMENTS);
    const annRows = await annSheet.getRows();

    // Load read IDs
    let readIds = new Set<string>();
    try {
      const readsSheet = await getSheet("Announcement_Reads_TBL");
      const readsRows = await readsSheet.getRows();
      readIds = new Set(
        readsRows
          .filter((r) => {
            const o = r.toObject() as any;
            return String(o.Employee_Email || "").toLowerCase() === email;
          })
          .map((r) => String(r.get("Announcement_ID") || ""))
      );
    } catch {
      // Reads sheet optional
    }

    announcements = annRows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Announcement_ID || ""),
          title: String(o.Title || ""),
          message: String(o.Message || ""),
          priority: String(o.Priority || "normal"),
          createdAt: String(o.Date || ""),
          targetRole: String(o.Target_Role || "all").toLowerCase(),
          targetEmail: String(o.Target_Email || "").toLowerCase().trim(),
          status: String(o.Status || "Active").toLowerCase(),
        };
      })
      .filter((a) => {
        if (!a.title) return false;
        if (a.status !== "active") return false;

        // If Target_Email → ONLY that person
        if (a.targetEmail && a.targetEmail.length > 0) {
          return a.targetEmail === email;
        }

        // Role filter
        if (a.targetRole === "all") return true;
        if (a.targetRole === role) return true;
        if (a.targetRole === "employee") return true;
        if (a.targetRole === "staff") return true;
        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // Add isRead + count unread
    announcements = announcements.map((a) => ({
      ...a,
      isRead: readIds.has(a.id),
    }));
    unreadCount = announcements.filter((a) => !a.isRead).length;
  } catch {
    // ignore
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <EmployeeSidebar
        user={{ name, email, role, photo }}
        permissions={{
          canRegisterSale: permissions.canRegisterSale,
          canRegisterIncome: permissions.canRegisterIncome,
          canViewAnnouncements: permissions.canViewAnnouncements,
          canCreateAnnouncements: permissions.canCreateAnnouncements,
        }}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              👋 Welcome, {name}!
            </h1>
            <p className="text-slate-500 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Today's Sales"
              value={todayCount}
              icon="📅"
              color="emerald"
            />
            <StatCard
              label="This Week"
              value={weekCount}
              icon="📊"
              color="blue"
            />
            <StatCard
              label="This Month"
              value={monthCount}
              icon="📈"
              color="purple"
            />
          </div>

          {/* Quick Actions — permission-based */}
          {(permissions.canRegisterSale || permissions.canRegisterIncome) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 mb-3">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {permissions.canRegisterSale && (
                  <Link
                    href="/employee/sale/new"
                    className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition"
                  >
                    <div className="text-3xl mb-2">🛒</div>
                    <p className="font-semibold text-emerald-700">
                      New Sale
                    </p>
                  </Link>
                )}
                {permissions.canRegisterIncome && (
                  <Link
                    href="/employee/income/new"
                    className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-center transition"
                  >
                    <div className="text-3xl mb-2">💰</div>
                    <p className="font-semibold text-blue-700">
                      New Income
                    </p>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Announcements */}
          {permissions.canViewAnnouncements && announcements.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900">
                  📢 Announcements
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <Link
                  href="/employee/announcements"
                  className="text-xs text-emerald-600 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {announcements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg border ${
                      a.isRead
                        ? "bg-slate-50 border-slate-200"
                        : "bg-blue-50 border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {!a.isRead && "🆕 "}
                        {a.priority === "high" && "🔴 "}
                        {a.priority === "urgent" && "🚨 "}
                        {a.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {a.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sales */}
          {recentSales.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 mb-3">
                🧾 Recent Sales
              </h2>
              <div className="space-y-2">
                {recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 border-b border-slate-100"
                  >
                    <div>
                      <p className="text-sm text-slate-900">
                        Sale #{s.id.slice(-6)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(s.date).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      {s.total.toLocaleString()} ETB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  const cls =
    {
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
    }[color] ?? "bg-slate-50 border-slate-200 text-slate-700";

  return (
    <div className={`p-4 rounded-2xl border ${cls}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
