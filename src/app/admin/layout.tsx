import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell"; // ወይም AdminShell ያለበት ትክክለኛ ዱካ

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const role = user.role || "staff";

  return (
    <AdminShell user={{ name: user.name, image: user.image }} role={role}>
      {children}
    </AdminShell>
  );
}
