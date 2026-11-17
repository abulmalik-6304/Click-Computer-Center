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
import AnnouncementsList from "@/components/employee/AnnouncementsList";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const EMPLOYEE_PERMS_SHEET = "Employee_Permissions_TBL";

export default async function EmployeeAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (!isEmployeeRole(role)) redirect("/admin/dashboard");

  const name = session.user?.name || "Employee";
  const email = String(session.user?.email || "").toLowerCase().trim();
  const photo = session.user?.image || null;

  // ✅ Load permissions
  let permissions = parseEmployeePermissions(email, {});
  try {
    const permSheet = await getSheet(EMPLOYEE_PERMS_SHEET);
    const permRows = await permSheet.getRows();
    const myPerm = permRows.find(
      (r) =>
        String((r.toObject() as any).Employee_Email || "").toLowerCase() ===
        email
    );
    if (myPerm) {
      permissions = parseEmployeePermissions(email, myPerm.toObject());
    }
  } catch {}

  // 🚫 Block if no permission
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
          </div>
        </main>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                📢 Announcements
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                የተላኩልዎ ማስታወቂያዎች
              </p>
            </div>
            <a
              href="/employee/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back
            </a>
          </div>

          <AnnouncementsList userEmail={email} />
        </div>
      </main>
    </div>
  );
}
