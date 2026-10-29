// src/app/api/staff/suspend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { canManage } from "@/lib/staff-control";

/**
 * POST /api/staff/suspend
 * Body: { targetEmail, action: "suspend" | "activate", reason? }
 *
 * Owner / Manager only.
 * - Owner can suspend anyone (except self)
 * - Manager can suspend only staff (not other managers/owners)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = String((session.user as any).role || "staff").toLowerCase();
  const callerEmail = String(session.user.email);

  try {
    const { targetEmail, action, reason } = await req.json();

    if (!targetEmail || !["suspend", "activate"].includes(action)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ─── Load target user ───
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

    // ─── Apply ───
    const newStatus = action === "suspend" ? "Suspended" : "Active";
    userRow.set("Status", newStatus);
    await userRow.save();

    // ─── Optional: log reason in a dedicated sheet ───
    if (reason) {
      try {
        const logSheet = await getSheet("Suspension_Log_TBL");
        const logRows = await logSheet.getRows();
        await logSheet.addRow({
          Log_ID: `LOG-${String(logRows.length + 1).padStart(4, "0")}`,
          Date: new Date().toISOString(),
          Target_Email: targetEmail,
          Target_Name: userRow.get("User_Name") || "",
          Action: action,
          Reason: reason,
          Performed_By: session.user.name ?? callerEmail,
          Performer_Role: callerRole,
        });
      } catch {
        // ሺቱ ከሌለ → skip
      }
    }

    return NextResponse.json({
      ok: true,
      newStatus,
      targetEmail,
      action,
    });
  } catch (e: any) {
    console.error("Suspend error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
