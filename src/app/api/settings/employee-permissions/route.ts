// src/app/api/settings/employee-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc, SHEETS } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import { parseEmployeePermissions } from "@/lib/employee-permissions";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const EMPLOYEE_PERMS_SHEET = "Employee_Permissions_TBL";

// ═══════════════════════════════════════════════════════════════
// GET: List all employees with their permissions
// ═══════════════════════════════════════════════════════════════
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
    // ─── Load employees from User_Access_TBL ───
    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();

    const employees = userRows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          email: String(o.User_Email || "").trim().toLowerCase(),
          name: String(o.User_Name || "").trim(),
          role: normalizeRole(o.Role),
          photo: String(o["Profile Picture"] || ""),
        };
      })
      .filter(
        (u) =>
          (u.role === "employee" || u.role === "staff") &&
          u.email.length > 0
      );

    // ─── Load permissions ───
    const permsMap: Record<string, any> = {};

    try {
      const permSheet = await getSheet(EMPLOYEE_PERMS_SHEET);
      const permRows = await permSheet.getRows();

      for (const pr of permRows) {
        const po = pr.toObject() as any;
        const email = String(po.Employee_Email || "")
          .trim()
          .toLowerCase();
        if (!email) continue;
        permsMap[email] = po;
      }
    } catch {
      // Sheet doesn't exist yet
    }

    // ─── Merge ───
    const withPermissions = employees.map((e) => {
      const permsRow = permsMap[e.email];
      const permissions = permsRow
        ? parseEmployeePermissions(e.email, permsRow)
        : parseEmployeePermissions(e.email, {});

      return {
        ...e,
        permissions,
      };
    });

    return NextResponse.json({ employees: withPermissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST: Save employee permissions
// ═══════════════════════════════════════════════════════════════
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

    // ─── Get or create sheet ───
    let sheet;
    try {
      sheet = await getSheet(EMPLOYEE_PERMS_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: EMPLOYEE_PERMS_SHEET,
        headerValues: [
          "Employee_Email",
          "Can_Access_Employee_Dashboard",
          "Can_Register_Sale",
          "Can_Register_Income",
          "Can_Register_Inventory", // 🆕
          "Can_View_Announcements",
          "Can_Create_Announcements",
          "Can_View_Reports", // ✅
          "Can_Print", // ✅
          "Can_View_Basic_Stats",
          "Updated_By",
          "Updated_At",
        ],
      });
    }

    // ─── Find existing row ───
    const rows = await sheet.getRows();
    const targetEmail = String(permissions.email).toLowerCase().trim();
    const existing = rows.find(
      (r) =>
        String(r.get("Employee_Email") || "").toLowerCase().trim() ===
        targetEmail
    );

    const fields: Record<string, string> = {
      Can_Access_Employee_Dashboard:
        permissions.canAccessEmployeeDashboard ? "TRUE" : "FALSE",
      Can_Register_Sale: permissions.canRegisterSale ? "TRUE" : "FALSE",
      Can_Register_Income: permissions.canRegisterIncome ? "TRUE" : "FALSE",
      Can_Register_Inventory: permissions.canRegisterInventory ? "TRUE" : "FALSE", // 🆕
      Can_View_Announcements:
        permissions.canViewAnnouncements ? "TRUE" : "FALSE",
      Can_Create_Announcements:
        permissions.canCreateAnnouncements ? "TRUE" : "FALSE",
      Can_View_Reports: permissions.canViewReports ? "TRUE" : "FALSE", // ✅
      Can_Print: permissions.canPrint ? "TRUE" : "FALSE", // ✅
      Can_View_Basic_Stats: permissions.canViewBasicStats ? "TRUE" : "FALSE",
      Updated_By: session.user?.email || "",
      Updated_At: new Date().toISOString(),
    };

    if (existing) {
      for (const [k, v] of Object.entries(fields)) {
        existing.set(k, v);
      }
      await existing.save();
    } else {
      await sheet.addRow({
        Employee_Email: targetEmail,
        ...fields,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
