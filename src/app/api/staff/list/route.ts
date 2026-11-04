// src/app/api/staff/list/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCachedRows } from "@/lib/sheets-cache";
import { SHEETS } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = normalizeRole((session.user as any).role);
  const callerEmail = String(session.user?.email || "").toLowerCase();

  try {
    const userData = await getCachedRows(SHEETS.USERS);

    let staff = userData.map((obj, idx) => ({
      id: String(obj.User_Email || `USR-${idx + 1}`),
      fullName: String(obj.User_Name || obj.User_Email || "Unknown"),
      email: String(obj.User_Email || "").toLowerCase().trim(),
      role: normalizeRole(obj.Role),
      status: String(obj.Status || "Active"),
      photo: String(obj["Profile Picture"] || ""),
      phone: String(obj["Phone No"] || ""),
      jobRole: String(obj.Role || "staff"),
      lastSeen: String(obj.Last_Seen || ""),
    }));

    // ═══════════════════════════════════════════════════════════════
    // ✅ ROLE-BASED FILTERING
    // ═══════════════════════════════════════════════════════════════
    if (callerRole === "owner") {
      // Owner sees ALL except themselves
      staff = staff.filter((s) => s.email !== callerEmail);
    } else if (callerRole === "manager") {
      // Manager sees ONLY staff/employee (not managers, not owners, not self)
      staff = staff.filter(
        (s) =>
          s.email !== callerEmail &&
          ["staff", "employee"].includes(s.role)
      );
    } else {
      // Staff/Employee cannot see the list
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ staff });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
