// src/app/api/settings/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getManagerPermissions,
  setManagerPermissions,
  ManagerPermissions,
} from "@/lib/permissions";
import { getSheet, SHEETS } from "@/lib/google-sheets";
// ✅ Settings = no cache, fresh every time

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List all managers with permissions ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  try {
    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();

    const managers = userRows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          email: String(obj.User_Email || ""),
          name: String(obj.User_Name || ""),
          role: String(obj.Role || "").toLowerCase(),
          photo: String(obj["Profile Picture"] || ""),
        };
      })
      .filter((u) => u.role === "manager" && u.email);

    // Load permissions for each manager
    const withPermissions = await Promise.all(
      managers.map(async (m) => {
        const perms = await getManagerPermissions(m.email);
        return {
          ...m,
          permissions: perms || {
            email: m.email,
            canVoid: false,
            canRefund: false,
            canDelete: false,
            canEditInventory: false,
            canExport: false,
            canViewActivity: false,
            canManageStaff: false,
            canViewProfit: false,
            canPrintCustomers: false, // ✅ አዲስ
            canPrintSuppliers: false, // ✅ አዲስ
          },
        };
      })
    );

    return NextResponse.json({ managers: withPermissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Update permissions ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { permissions } = body as { permissions: ManagerPermissions };

    if (!permissions?.email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const result = await setManagerPermissions(
      permissions,
      session.user?.name ?? session.user?.email ?? ""
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
