// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { hashPassword, checkPasswordStrength } from "@/lib/password-utils";

/**
 * POST /api/auth/reset-password
 * Body: { targetEmail, newPassword }
 * Owner or Manager resets another user's password.
 *
 * ⚠️ Only owner can reset owner/manager. Manager can reset staff only.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = String(
    (session.user as any).role || "staff"
  ).toLowerCase();
  if (!["owner", "manager"].includes(callerRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { targetEmail, newPassword } = await req.json();
    if (!targetEmail || !newPassword) {
      return NextResponse.json(
        { error: "targetEmail and newPassword required" },
        { status: 400 }
      );
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { error: `Password too weak: ${strength.message}` },
        { status: 400 }
      );
    }

    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();
    const targetEmailLc = String(targetEmail).toLowerCase().trim();
    const userRow = rows.find((r) => {
      const e = (r.get("User_Email") || "").toLowerCase().trim();
      return e === targetEmailLc;
    });

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ─── Role boundary check ───
    const targetRole = String(userRow.get("Role") || "staff").toLowerCase();
    if (callerRole === "manager" && ["owner", "manager"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Managers cannot reset owner/manager passwords" },
        { status: 403 }
      );
    }
    if (callerRole === "owner" && targetEmailLc === String(session.user.email).toLowerCase()) {
      return NextResponse.json(
        { error: "Use the self-service change password form" },
        { status: 400 }
      );
    }

    // ─── Save hash ───
    const hashed = await hashPassword(newPassword);
    userRow.set("Password", hashed);
    await userRow.save();

    return NextResponse.json({ ok: true, message: "Password reset" });
  } catch (e: any) {
    console.error("Reset password error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
