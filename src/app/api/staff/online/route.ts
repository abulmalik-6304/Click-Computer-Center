// src/app/api/staff/online/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { normalizeRole, isOnline, lastSeenLabel } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: Online staff list ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();

    const staff = rows.map((r) => {
      const obj = r.toObject() as any;
      const lastSeen = String(obj.Last_Seen || "");
      return {
        id: String(obj.User_Email || ""),
        name: String(obj.User_Name || ""),
        email: String(obj.User_Email || ""),
        role: normalizeRole(obj.Role),
        photo: String(obj["Profile Picture"] || ""),
        lastSeen,
        isOnline: isOnline(lastSeen),
        lastSeenLabel: lastSeenLabel(lastSeen),
        status: String(obj.Status || "Active"),
      };
    });

    // Only active users
    const active = staff.filter(
      (s) => s.status.toLowerCase() !== "suspended" && s.status.toLowerCase() !== "inactive"
    );

    const online = active.filter((s) => s.isOnline);
    const offline = active.filter((s) => !s.isOnline);

    return NextResponse.json({
      online,
      offline,
      total: active.length,
      onlineCount: online.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
