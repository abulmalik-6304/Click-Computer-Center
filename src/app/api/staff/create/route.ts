// src/app/api/staff/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc, SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { refreshCache } from "@/lib/sheets-cache";
import bcrypt from "bcryptjs";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = String((session.user as any).role || "").toLowerCase();
  const callerEmail = String(session.user?.email || "");

  const canManage = await hasPermission(callerEmail, callerRole, "canManageStaff");
  if (!canManage) {
    return NextResponse.json(
      { error: "No permission to manage staff" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      userName,
      email,
      phone,
      role,
      profilePicture,
      password,
      jobRole,
    } = body;

    // Validation
    if (!userName || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Manager can only add staff/employee
    if (callerRole === "manager" && !["staff", "employee"].includes(role || "staff")) {
      return NextResponse.json(
        { error: "Managers can only add staff/employee" },
        { status: 403 }
      );
    }

    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();

    // Check duplicate email
    const exists = rows.some(
      (r) =>
        String(r.get("User_Email")).toLowerCase() === email.toLowerCase().trim()
    );
    if (exists) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);

    await sheet.addRow({
      "Profile Picture": profilePicture || "",
      User_Name: userName,
      User_Email: email.toLowerCase().trim(),
      "Phone No": phone || "",
      Role: String(role || "staff").toLowerCase(),
      Status: "Active",
      Last_Seen: "",
      Password: hashed,
    });

    // Refresh cache
    await refreshCache(SHEETS.USERS);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Create staff error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
