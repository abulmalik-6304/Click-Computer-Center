// src/app/admin/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import SigninLogClient from "./SigninLogClient";
import ManagerPermissions from "@/components/admin/settings/ManagerPermissions";
import ProfitSharingSettings from "@/components/admin/settings/ProfitSharingSettings";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();
  const isOwner = role === "owner";

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <SettingsClient
        user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          role: role,
          image: session.user.image ?? null,
        }}
      />

      {/* ✅ Manager Permissions — Owner only */}
      {isOwner && <ManagerPermissions />}

      {/* ✅ Profit Sharing Settings — Owner only */}
      {isOwner && <ProfitSharingSettings />}

      {/* ✅ Sign-in Log */}
      <SigninLogClient />
    </div>
  );
}
