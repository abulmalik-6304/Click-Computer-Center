// src/app/admin/profit-sharing/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import ProfitSharingClient from "./ProfitSharingClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ProfitSharingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "").toLowerCase();
  const email = String(session.user?.email || "");

  // ✅ Permission check
  const canViewProfit = await hasPermission(email, role, "canViewProfit");

  if (!canViewProfit) {
    return (
      <div className="p-10 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-4xl mb-3">🚫</p>
          <h1 className="text-xl font-bold text-red-900 mb-2">Access Denied</h1>
          <p className="text-sm text-red-700">
            You don&apos;t have permission to view Profit Report.
          </p>
          <p className="text-xs text-red-600 mt-2">
            Contact the owner to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProfitSharingClient
      userRole={role}
      userName={session.user?.name ?? session.user?.email ?? "User"}
      userEmail={email}
    />
  );
}
