// src/app/api/staff/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";
import { refreshCache } from "@/lib/sheets-cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = normalizeRole((session.user as any).role);
  const callerEmail = String(session.user?.email || "").toLowerCase().trim();

  const canManage = await hasPermission(callerEmail, callerRole, "canManageStaff");
  if (!canManage) {
    return NextResponse.json({ error: "No permission to manage staff" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { targetEmail, updates } = body;

    if (!targetEmail || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ✅ Prevent self-edit
    if (targetEmail.toLowerCase().trim() === callerEmail) {
      return NextResponse.json(
        { error: "You cannot edit your own account here" },
        { status: 400 }
      );
    }

    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();
    const targetRow = rows.find(
      (r) =>
        String(r.get("User_Email")).toLowerCase().trim() ===
        targetEmail.toLowerCase().trim()
    );
    if (!targetRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = normalizeRole(targetRow.get("Role"));

    // ═══════════════════════════════════════════════════════════════
    // ✅ ROLE BOUNDARY — Manager can only edit staff/employee
    // ═══════════════════════════════════════════════════════════════
    if (callerRole === "manager") {
      if (!["staff", "employee"].includes(targetRole)) {
        return NextResponse.json(
          { error: "Managers can only edit staff/employee accounts" },
          { status: 403 }
        );
      }
    }

    // ✅ Only owner can change roles
    if (updates.role && updates.role !== targetRole) {
      if (callerRole !== "owner") {
        return NextResponse.json(
          { error: "Only owner can change roles" },
          { status: 403 }
        );
      }
      // Owner cannot change another owner's role
      if (targetRole === "owner") {
        return NextResponse.json(
          { error: "Cannot change another owner's role" },
          { status: 403 }
        );
      }
    }

    // ✅ Only owner can suspend/activate managers or owners
    if (updates.status !== undefined) {
      const isStatusChange = String(updates.status) !== String(targetRow.get("Status") || "");
      if (
        isStatusChange &&
        callerRole === "manager" &&
        !["staff", "employee"].includes(targetRole)
      ) {
        return NextResponse.json(
          { error: "Managers can only change status of staff/employee" },
          { status: 403 }
        );
      }
    }

    // Apply updates
    if (updates.userName !== undefined) targetRow.set("User_Name", updates.userName);
    if (updates.phone !== undefined) targetRow.set("Phone No", updates.phone);
    if (updates.role !== undefined) targetRow.set("Role", updates.role);
    if (updates.profilePicture !== undefined)
      targetRow.set("Profile Picture", updates.profilePicture);
    if (updates.status !== undefined) targetRow.set("Status", updates.status);

    await targetRow.save();
    await refreshCache(SHEETS.USERS);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Staff update error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
