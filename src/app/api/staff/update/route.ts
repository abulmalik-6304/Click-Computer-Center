// src/app/api/staff/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { refreshCache } from "@/lib/sheets-cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * PUT /api/staff/update
 * Body: { targetEmail, updates: { userName?, phone?, role?, profilePicture?, status? } }
 *
 * Permission rules:
 * - Owner: can change anyone's role + details
 * - Manager (with canManageStaff): can change staff/employee details, CANNOT change roles
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = String((session.user as any).role || "").toLowerCase();
  const callerEmail = String(session.user?.email || "");

  // ✅ Check permission
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

    // Prevent self-edit
    if (targetEmail.toLowerCase() === callerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot edit your own account here" },
        { status: 400 }
      );
    }

    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();
    const targetRow = rows.find(
      (r) =>
        String(r.get("User_Email")).toLowerCase() ===
        targetEmail.toLowerCase()
    );
    if (!targetRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = String(targetRow.get("Role") || "staff").toLowerCase();

    // ✅ Role change restriction
    if (updates.role && updates.role !== targetRole) {
      if (callerRole !== "owner") {
        return NextResponse.json(
          { error: "Only owner can change roles" },
          { status: 403 }
        );
      }
      // Owner cannot demote themselves
      if (targetRole === "owner") {
        return NextResponse.json(
          { error: "Cannot change another owner's role" },
          { status: 403 }
        );
      }
    }

    // Manager can only manage staff/employee, not other managers
    if (
      callerRole === "manager" &&
      ["owner", "manager"].includes(targetRole) &&
      !updates.role
    ) {
      return NextResponse.json(
        { error: "Managers cannot edit owner/manager accounts" },
        { status: 403 }
      );
    }

    // Apply updates
    if (updates.userName !== undefined) targetRow.set("User_Name", updates.userName);
    if (updates.phone !== undefined) targetRow.set("Phone No", updates.phone);
    if (updates.role !== undefined) targetRow.set("Role", updates.role);
    if (updates.profilePicture !== undefined)
      targetRow.set("Profile Picture", updates.profilePicture);
    if (updates.status !== undefined) targetRow.set("Status", updates.status);

    await targetRow.save();

    // ✅ Invalidate cache
    await refreshCache(SHEETS.USERS);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Staff update error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
