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
  // ✅ LOAD PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  let permissions = parseEmployeePermissions(email, {});

  try {
    const permSheet = await getSheet(EMPLOYEE_PERMS_SHEET);
    const permRows = await permSheet.getRows();
    const myPerm = permRows.find((r) => {
      const o = r.toObject() as any;
      return (
        String(o.Employee_Email || "").toLowerCase().trim() === email
      );
    });
    if (myPerm) {
      permissions = parseEmployeePermissions(email, myPerm.toObject());
    }
  } catch {}

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD ALL STATS (today/week/month/all)
  // ═══════════════════════════════════════════════════════════════
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let allCount = 0;
  let todayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;
  let allTotal = 0;
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
          recordedBy: String(o.Recorded_By || "").toLowerCase(),
          total: Number(o.Total_Amount || 0),
        };
      })
      .filter(
        (s) =>
          s.recordedBy === email ||
          s.recordedBy === name.toLowerCase()
      );

    for (const s of mySales) {
      const d = new Date(s.date);
      if (d >= today) {
        todayCount++;
        todayTotal += s.total;
      }
      if (d >= weekAgo) {
        weekCount++;
        weekTotal += s.total;
      }
      if (d >= monthAgo) {
        monthCount++;
        monthTotal += s.total;
      }
      allCount++;
      allTotal += s.total;
    }

    recentSales = mySales
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  } catch {}

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD ANNOUNCEMENTS
  // ═══════════════════════════════════════════════════════════════
  let announcements: any[] = [];
  let unreadCount = 0;

  if (permissions.canViewAnnouncements) {
    try {
      const annSheet = await getSheet(SHEETS.ANNOUNCEMENTS);
      const annRows = await annSheet.getRows();

      let readIds = new Set<string>();
      try {
        const readsSheet = await getSheet("Announcement_Reads_TBL");
        const readsRows = await readsSheet.getRows();
        readIds = new Set(
          readsRows
            .filter((r) => {
              const o = r.toObject() as any;
              return (
                String(o.Employee_Email || "").toLowerCase().trim() === email
              );
            })
            .map((r) => String(r.get("Announcement_ID") || ""))
        );
      } catch {}

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
          if (a.targetEmail && a.targetEmail.length > 0) {
            return a.targetEmail === email;
          }
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

      announcements = announcements.map((a) => ({
        ...a,
        isRead: readIds.has(a.id),
      }));
      unreadCount = announcements.filter((a) => !a.isRead).length;
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎨 COMPUTED STATS
  // ═══════════════════════════════════════════════════════════════
  const monthPct = allCount > 0 ? (monthCount / allCount) * 100 : 0;
  const weekPct = monthCount > 0 ? (weekCount / monthCount) * 100 : 0;
  const todayPct = weekCount > 0 ? (todayCount / weekCount) * 100 : 0;

  return (
    <div className="flex h-screen bg-slate-50">
      <EmployeeSidebar
        user={{ name, email, role, photo }}
        permissions={{
          canRegisterSale: permissions.canRegisterSale,
          canRegisterIncome: permissions.canRegisterIncome,
          canRegisterInventory: permissions.canRegisterInventory,
          canViewAnnouncements: permissions.canViewAnnouncements,
          canCreateAnnouncements: permissions.canCreateAnnouncements,
        }}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
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

          {/* ═══════════════════════════════════════════════════════════
              🎨 STATS — Beautiful cards with percentages
          ═══════════════════════════════════════════════════════════ */}
          {permissions.canViewBasicStats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCardEnhanced
                  label="Today"
                  count={todayCount}
                  total={todayTotal}
                  pct={todayPct}
                  icon="📅"
                  color="emerald"
                />
                <StatCardEnhanced
                  label="This Week"
                  count={weekCount}
                  total={weekTotal}
                  pct={weekPct}
                  icon="📊"
                  color="blue"
                />
                <StatCardEnhanced
                  label="This Month"
                  count={monthCount}
                  total={monthTotal}
                  pct={monthPct}
                  icon="📈"
                  color="purple"
                />
                <StatCardEnhanced
                  label="All Time"
                  count={allCount}
                  total={allTotal}
                  pct={100}
                  icon="🏆"
                  color="amber"
                />
              </div>

              {/* Percentage Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-900 mb-3">
                  📊 Your Progress (Last 30 Days)
                </h2>
                <div className="space-y-3">
                  <ProgressBar
                    label={`Today (${todayCount} sales)`}
                    pct={todayPct}
                    color="emerald"
                  />
                  <ProgressBar
                    label={`This Week (${weekCount} sales)`}
                    pct={weekPct}
                    color="blue"
                  />
                  <ProgressBar
                    label={`This Month (${monthCount} sales)`}
                    pct={monthPct}
                    color="purple"
                  />
                </div>
              </div>
            </>
          )}

          {/* Quick Actions */}
          {(permissions.canRegisterSale ||
            permissions.canRegisterIncome ||
            permissions.canRegisterInventory) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 mb-3">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
                {permissions.canRegisterInventory && (
                  <Link
                    href="/employee/inventory/new"
                    className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-center transition"
                  >
                    <div className="text-3xl mb-2">📦</div>
                    <p className="font-semibold text-purple-700">
                      New Inventory
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
                    <p className="text-sm font-semibold text-slate-900">
                      {!a.isRead && "🆕 "}
                      {a.priority === "high" && "🔴 "}
                      {a.priority === "urgent" && "🚨 "}
                      {a.title}
                    </p>
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

// ═══════════════════════════════════════════════════════════════
// 🎨 ENHANCED STAT CARD
// ═══════════════════════════════════════════════════════════════
function StatCardEnhanced({
  label,
  count,
  total,
  pct,
  icon,
  color,
}: {
  label: string;
  count: number;
  total: number;
  pct: number;
  icon: string;
  color: string;
}) {
  const cls =
    {
      emerald: {
        card: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-700",
        bar: "bg-emerald-500",
      },
      blue: {
        card: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
        bar: "bg-blue-500",
      },
      purple: {
        card: "bg-purple-50 border-purple-200",
        text: "text-purple-700",
        bar: "bg-purple-500",
      },
      amber: {
        card: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
        bar: "bg-amber-500",
      },
    }[color] ?? {
      card: "bg-slate-50 border-slate-200",
      text: "text-slate-700",
      bar: "bg-slate-500",
    };

  return (
    <div className={`p-4 rounded-2xl border ${cls.card}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${cls.text}`}>{count}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {total.toLocaleString()} ETB
      </p>
      <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${cls.bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-1">
        {pct.toFixed(0)}% of period
      </p>
    </div>
  );
}

function ProgressBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  const barCls =
    {
      emerald: "bg-emerald-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
    }[color] ?? "bg-slate-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <p className="text-xs font-bold text-slate-900">
          {pct.toFixed(1)}%
        </p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barCls} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
