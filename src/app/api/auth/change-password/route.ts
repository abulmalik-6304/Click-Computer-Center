// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  checkPasswordStrength,
} from "@/lib/password-utils";

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword, confirmPassword }
 * User changes their OWN password.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    // ─── Validate inputs ───
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
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

    // ─── Load user from sheet ───
    const sheet = await getSheet(SHEETS.USERS); // "User_Access_TBL"
    const rows = await sheet.getRows();
    const userEmail = String(session.user.email).toLowerCase().trim();
    const userRow = rows.find((r) => {
      const e = (r.get("User_Email") || r.get("User_Name") || "")
        .toLowerCase()
        .trim();
      return e === userEmail;
    });

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ─── Verify current password ───
    const stored = String(userRow.get("Password") || "");
    let currentOk = false;
    if (isBcryptHash(stored)) {
      currentOk = await verifyPassword(currentPassword, stored);
    } else {
      // Legacy plaintext (avoid this going forward)
      currentOk = currentPassword === stored;
    }
    if (!currentOk) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // ─── Save new hash ───
    const hashed = await hashPassword(newPassword);
    userRow.set("Password", hashed);
    await userRow.save();

    return NextResponse.json({ ok: true, message: "Password changed" });
  } catch (e: any) {
    console.error("Change password error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to change password" },
      { status: 500 }
    );
  }
}
