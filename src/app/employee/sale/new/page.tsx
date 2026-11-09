// src/app/employee/sale/new/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import { isEmployeeRole } from "@/lib/employee-permissions";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";
import QuickSaleForm from "@/components/employee/QuickSaleForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (!isEmployeeRole(role)) redirect("/admin/dashboard");

  const name = session.user?.name || "Employee";
  const email = String(session.user?.email || "");
  const photo = session.user?.image || null;

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
        <div className="max-w-5xl mx-auto space-y-6">
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
