import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";
import Providers from "./Providers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const rawRole = (session.user as any).role || "staff";
  const role = String(rawRole).toLowerCase();

  return (
    <Providers session={session}>
      <AdminShell
        user={{
          name: session.user.name ?? "User",
          image: session.user.image ?? null,
        }}
        role={role}
      >
        {children}
      </AdminShell>
    </Providers>
  );
}
