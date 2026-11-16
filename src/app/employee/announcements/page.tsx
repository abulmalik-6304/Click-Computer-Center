// src/app/employee/announcements/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import { getSheet } from "@/lib/google-sheets";
import {
  isEmployeeRole,
  parseEmployeePermissions,
} from "@/lib/employee-permissions";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const EMPLOYEE_PERMS_SHEET = "Employee_Permissions_TBL";

interface Announcement {
  id: string;
  date: string;
  image: string;
  title: string;
  message: string;
  priority: string;
}

export default async function EmployeeAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (!isEmployeeRole(role)) redirect("/admin/dashboard");

  const name = session.user?.name || "Employee";
  const email = String(session.user?.email || "").toLowerCase().trim();
  const photo = session.user?.image || null;

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD EMPLOYEE PERMISSIONS (dynamic — from DB)
  // ═══════════════════════════════════════════════════════════════
  let permissions = parseEmployeePermissions(email, {}); // defaults

  try {
    const permSheet = await getSheet(EMPLOYEE_PERMS_SHEET);
    const permRows = await permSheet.getRows();
    const myPerm = permRows.find(
      (r) =>
        String((r.toObject() as any).Employee_Email || "")
          .toLowerCase()
          .trim() === email
    );
    if (myPerm) {
      permissions = parseEmployeePermissions(email, myPerm.toObject());
    }
  } catch {
    // Sheet may not exist yet — use defaults
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ BLOCK if no view permission
  // ═══════════════════════════════════════════════════════════════
  if (!permissions.canViewAnnouncements) {
    return (
      <div className="flex h-screen bg-slate-50">
        <EmployeeSidebar
          user={{ name, email, role, photo }}
          permissions={{
            canRegisterSale: permissions.canRegisterSale,
            canRegisterIncome: permissions.canRegisterIncome,
            canRegisterInventory: permissions.canRegisterInventory,
            canViewAnnouncements: false,
            canCreateAnnouncements: false,
          }}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
            <p className="text-4xl mb-3">🚫</p>
            <h1 className="text-xl font-bold text-red-900 mb-2">
              Access Denied
            </h1>
            <p className="text-sm text-red-700">
              You don't have permission to view announcements.
            </p>
            <a
              href="/employee/dashboard"
              className="inline-block mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm"
            >
              ← Back to Dashboard
            </a>
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD ANNOUNCEMENTS (role-filtered)
  // ═══════════════════════════════════════════════════════════════
  let announcements: Announcement[] = [];
  try {
    const sheet = await getSheet("Announcements_TBL");
    const rows = await sheet.getRows();
    announcements = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Announcement_ID || ""),
          date: String(o.Date || ""),
          image: String(o.Image || ""),
          title: String(o.Title || ""),
          message: String(o.Message || ""),
          priority: String(o.Priority || "normal"),
          targetRole: String(o.Target_Role || "all").toLowerCase(),
          targetEmail: String(o.Target_Email || "").toLowerCase().trim(),
          status: String(o.Status || "Active").toLowerCase(),
        };
      })
      .filter((a) => {
        if (!a.title) return false;
        if (a.status !== "active") return false;

        // 🎯 Target email → only that person
        if (a.targetEmail && a.targetEmail.length > 0) {
          return a.targetEmail === email;
        }

        // 🎯 Target role
        if (a.targetRole === "all") return true;
        if (a.targetRole === role) return true;
        if (a.targetRole === "employee") return true;
        if (a.targetRole === "staff") return true;
        return false;
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch {
    announcements = [];
  }

  // ✅ Unread count (placeholder — no reads tracking yet)
  const unreadCount = 0;

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
        <div className="max-w-3xl mx-auto space-y-6">
          {/* ═══════════════════════════════════════════════════════
              HEADER — with "New Announcement" button (permission-gated)
          ═══════════════════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                📢 Announcements
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {announcements.length} ማስታወቂያዎች
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* 🆕 New Announcement button — permission-gated */}
              {permissions.canCreateAnnouncements && (
                <a
                  href="/employee/announcements/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition text-sm"
                >
                  ✉️ + New Announcement
                </a>
              )}
              <a
                href="/employee/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm transition text-sm"
              >
                ← Back
              </a>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              LIST
          ═══════════════════════════════════════════════════════ */}
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-500">No announcements yet</p>
              <p className="text-xs text-slate-400 mt-2">
                Check back later for updates from management
              </p>
              {permissions.canCreateAnnouncements && (
                <a
                  href="/employee/announcements/new"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm"
                >
                  ✉️ Create First Announcement
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`bg-white rounded-2xl border p-5 ${
                    a.priority === "urgent"
                      ? "border-red-300 bg-red-50/30"
                      : a.priority === "high"
                      ? "border-orange-300 bg-orange-50/30"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-bold text-slate-900">
                      {a.priority === "urgent" && "🚨 "}
                      {a.priority === "high" && "🔴 "}
                      {a.title}
                    </h2>
                    <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
                      {new Date(a.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {a.image && (
                    <img
                      src={a.image}
                      alt={a.title}
                      className="w-full max-h-64 object-cover rounded-lg mb-3"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src =
                          "/placeholder.svg")
                      }
                    />
                  )}
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
