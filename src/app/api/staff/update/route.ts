// src/app/api/staff/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { canManage, canChangeRole } from "@/lib/staff-control";

/**
 * PUT /api/staff/update
 * Body: { targetEmail, updates: { userName?, phone?, role?, profilePicture?, status? } }
 *
 * Owner / Manager only.
 * Role change: owner only.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = String((session.user as any).role || "staff").toLowerCase();
  const callerEmail = String(session.user.email);

  try {
    const { targetEmail, updates } = await req.json();

    if (!targetEmail || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();
    const targetLc = String(targetEmail).toLowerCase().trim();
    const userRow = rows.find((r) => {
      const e = (r.get("User_Email") || "").toLowerCase().trim();
      return e === targetLc;
    });

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = String(userRow.get("Role") || "staff");

    // ─── Permission check ───
    const check = canManage(callerRole, targetRole, callerEmail, targetEmail);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    // ─── Role change guard ───
    if (updates.role && updates.role !== targetRole) {
      const roleCheck = canChangeRole(callerRole, callerEmail, targetEmail);
      if (!roleCheck.allowed) {
        return NextResponse.json({ error: roleCheck.reason }, { status: 403 });
      }
    }

    // ─── Allowed fields ───
    const allowed = ["User_Name", "Phone No", "Role", "Profile Picture", "Status"];
    const mapping: Record<string, string> = {
      userName: "User_Name",
      phone: "Phone No",
      role: "Role",
      profilePicture: "Profile Picture",
      status: "Status",
    };

    const changed: string[] = [];
    for (const [clientKey, value] of Object.entries(updates)) {
      const sheetKey = mapping[clientKey];
      if (!sheetKey || !allowed.includes(sheetKey)) continue;
      if (value === undefined || value === null) continue;
      userRow.set(sheetKey, value);
      changed.push(sheetKey);
    }

    if (changed.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await userRow.save();

    return NextResponse.json({ ok: true, changed });
  } catch (e: any) {
    console.error("Update error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
