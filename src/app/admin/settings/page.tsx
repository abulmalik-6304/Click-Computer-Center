// src/app/admin/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import SigninLogClient from "./SigninLogClient"; // ✅ አዲስ ኢምፖርት

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <SettingsClient
        user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          role: ((session.user as any).role as string) ?? "staff",
          image: session.user.image ?? null,
        }}
      />

      {/* ✅ የግባ/ውጣ ምዝግብ ማስታወሻ (Signin Log) መቆጣጠሪያ */}
      <SigninLogClient />
    </div>
  );
}
