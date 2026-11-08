// src/app/api/settings/employee-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const EMPLOYEE_PERMS_SHEET = "Employee_Permissions_TBL";

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
    // Load employees from User_Access_TBL
    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();
    const employees = userRows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          email: String(o.User_Email || ""),
          name: String(o.User_Name || ""),
          role: String(o.Role || "").toLowerCase(),
          photo: String(o["Profile Picture"] || ""),
        };
      })
      .filter(
        (u) =>
          (u.role === "employee" || u.role === "staff") && u.email
      );

    // Load permissions (if sheet exists)
    let permsMap: Record<string, any> = {};
    try {
      const permSheet = await getSheet(EMPLOYEE_PERMS_SHEET);
      const permRows = await permSheet.getRows();
      for (const pr of permRows) {
        const po = pr.toObject() as any;
        const email = String(po.Employee_Email || "").toLowerCase();
        if (!email) continue;
        permsMap[email] = {
          canAccessEmployeeDashboard:
            String(po.Can_Access_Employee_Dashboard || "").toUpperCase() ===
            "TRUE",
          canRegisterSale:
            String(po.Can_Register_Sale || "").toUpperCase() === "TRUE",
          canRegisterIncome:
            String(po.Can_Register_Income || "").toUpperCase() === "TRUE",
          canViewAnnouncements:
            String(po.Can_View_Announcements || "").toUpperCase() === "TRUE",
          canCreateAnnouncements:
            String(po.Can_Create_Announcements || "").toUpperCase() === "TRUE",
        };
      }
    } catch {
      // sheet doesn't exist yet — use defaults
    }

    const withPermissions = employees.map((e) => ({
      ...e,
      permissions: {
        email: e.email,
        canAccessEmployeeDashboard:
          permsMap[e.email.toLowerCase()]?.canAccessEmployeeDashboard ?? true,
        canRegisterSale:
          permsMap[e.email.toLowerCase()]?.canRegisterSale ?? true,
        canRegisterIncome:
          permsMap[e.email.toLowerCase()]?.canRegisterIncome ?? true,
        canViewAnnouncements:
          permsMap[e.email.toLowerCase()]?.canViewAnnouncements ?? true,
        canCreateAnnouncements:
          permsMap[e.email.toLowerCase()]?.canCreateAnnouncements ?? false,
      },
    }));

    return NextResponse.json({ employees: withPermissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { permissions } = body;

    if (!permissions?.email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Get or create sheet
    let sheet;
    try {
      sheet = await getSheet(EMPLOYEE_PERMS_SHEET);
    } catch {
      // Create sheet
      const { getDoc } = await import("@/lib/google-sheets");
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: EMPLOYEE_PERMS_SHEET,
        headerValues: [
          "Employee_Email",
          "Can_Access_Employee_Dashboard",
          "Can_Register_Sale",
          "Can_Register_Income",
          "Can_View_Announcements",
          "Can_Create_Announcements",
          "Updated_By",
          "Updated_At",
        ],
      });
    }

    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) =>
        String(r.get("Employee_Email")).toLowerCase() ===
        String(permissions.email).toLowerCase()
    );

    const fields = {
      Can_Access_Employee_Dashboard:
        permissions.canAccessEmployeeDashboard ? "TRUE" : "FALSE",
      Can_Register_Sale: permissions.canRegisterSale ? "TRUE" : "FALSE",
      Can_Register_Income: permissions.canRegisterIncome ? "TRUE" : "FALSE",
      Can_View_Announcements:
        permissions.canViewAnnouncements ? "TRUE" : "FALSE",
      Can_Create_Announcements:
        permissions.canCreateAnnouncements ? "TRUE" : "FALSE",
      Updated_By: session.user?.email || "",
      Updated_At: new Date().toISOString(),
    };

    if (existing) {
      for (const [k, v] of Object.entries(fields)) existing.set(k, v);
      await existing.save();
    } else {
      await sheet.addRow({
        Employee_Email: permissions.email,
        ...fields,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
