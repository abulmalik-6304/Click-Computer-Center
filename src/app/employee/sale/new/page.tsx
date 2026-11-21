// src/app/employee/sale/new/page.tsx
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
import QuickSaleForm from "@/components/employee/QuickSaleForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const EMPLOYEE_PERMS_SHEET = "Employee_Permissions_TBL";

export default async function NewSalePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (!isEmployeeRole(role)) redirect("/admin/dashboard");

  const name = session.user?.name || "Employee";
  const email = String(session.user?.email || "").toLowerCase().trim();
  const photo = session.user?.image || null;

  // ═══════════════════════════════════════════════════════════════
  // ✅ LOAD REAL PERMISSIONS FROM SHEET
  // ═══════════════════════════════════════════════════════════════
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
  if (!permissions.canRegisterSale) {
    return (
      <div className="min-h-screen bg-slate-50">
        <EmployeeSidebar
          user={{ name, email, role, photo }}
          permissions={{
            canRegisterSale: false,
            canRegisterIncome: permissions.canRegisterIncome,
            canRegisterInventory: permissions.canRegisterInventory,
            canViewAnnouncements: permissions.canViewAnnouncements,
            canCreateAnnouncements: permissions.canCreateAnnouncements,
          }}
        />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="flex items-center justify-center p-6 min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
              <p className="text-4xl mb-3">🚫</p>
              <h1 className="text-xl font-bold text-red-900 mb-2">
                Access Denied
              </h1>
              <p className="text-sm text-red-700">
                You don't have permission to register sales.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                🛒 New Sale
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                ሽያጭ ይመዝግቡ — ቀላል እና ፈጣን
              </p>
            </div>
            <a
              href="/employee/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back
            </a>
          </div>

          <QuickSaleForm />
        </div>
      </main>
    </div>
  );
}
