// src/app/employee/announcements/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import { getSheet } from "@/lib/google-sheets";
import { isEmployeeRole } from "@/lib/employee-permissions";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function EmployeeAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (!isEmployeeRole(role)) redirect("/admin/dashboard");

  const name = session.user?.name || "Employee";
  const email = String(session.user?.email || "");
  const photo = session.user?.image || null;

  // ─── Load announcements ───
  let announcements: any[] = [];
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
          targetRole: String(o.Target_Role || "all").toLowerCase(),
          status: String(o.Status || "Active").toLowerCase(),
        };
      })
      .filter(
        (a) =>
          a.title &&
          a.status === "active" &&
          (a.targetRole === "all" ||
            a.targetRole === role ||
            a.targetRole === "employee")
      )
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch {
    announcements = [];
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <EmployeeSidebar
        user={{ name, email, role, photo }}
        permissions={{
          canRegisterSale: true,
          canRegisterIncome: true,
          canViewAnnouncements: true,
          canCreateAnnouncements: false,
        }}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                📢 Announcements
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {announcements.length} ማስታወቂያዎች
              </p>
            </div>
            <a
              href="/employee/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back
            </a>
          </div>

          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-500">No announcements yet</p>
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
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString()}
                    </span>
                  </div>
                  {a.image && (
                    <img
                      src={a.image}
                      alt={a.title}
                      className="w-full max-h-64 object-cover rounded-lg mb-3"
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
