// src/app/admin/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import SigninLogClient from "./SigninLogClient";
import ManagerPermissions from "@/components/admin/settings/ManagerPermissions";
import EmployeePermissions from "@/components/admin/settings/EmployeePermissions";
import ProfitSharingSettings from "@/components/admin/settings/ProfitSharingSettings";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();
  const isOwner = role === "owner";
  const isManager = role === "manager";

  // 🚫 Block employee/staff
  if (!isOwner && !isManager) {
    redirect("/employee/dashboard");
  }

  const pageKey = `settings-${Date.now()}`;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* ✅ Profile Settings — ሁሉም ያያል */}
      <SettingsClient
        key={`profile-${pageKey}`}
        user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          role: role,
          image: session.user.image ?? null,
        }}
      />

      {/* ✅ Manager Permissions — Owner ብቻ */}
      {isOwner && <ManagerPermissions key={`perms-${pageKey}`} />}

      {/* ✅ Employee Permissions — Owner + Manager */}
      {(isOwner || isManager) && (
        <EmployeePermissions
          key={`emp-perms-${pageKey}`}
          canManage={isOwner || isManager}
        />
      )}

      {/* ✅ Profit Sharing — Owner ብቻ */}
      {isOwner && <ProfitSharingSettings key={`profit-${pageKey}`} />}

      {/* ✅ Sign-in Log — Owner + Manager */}
      {(isOwner || isManager) && (
        <SigninLogClient key={`signin-${pageKey}`} />
      )}
    </div>
  );
}
