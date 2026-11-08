// src/app/api/employees/refresh/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List all employees (from User_Access_TBL) ───
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
    const sheet = await getSheet(SHEETS.USERS); // ✅ User_Access_TBL
    const rows = await sheet.getRows();

    const employees = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          // ─── Core identity ───
          id: String(obj.User_Email || ""),          // use email as id
          empId: String(obj["Emp-ID"] || ""),         // 🆕 Emp-ID
          email: String(obj.User_Email || ""),
          name: String(obj.User_Name || ""),
          role: normalizeRole(obj.Role),
          status: String(obj.Status || "Active"),

          // ─── Contact ───
          phone: String(obj["Phone No"] || ""),
          emergencyContact: String(obj.Emergency_Contact || ""),

          // ─── Employment ───
          jobRole: String(obj.Job_Role || obj.Role || ""),
          salary: Number(obj.Salary || 0),
          allowance: Number(obj.Allowance || 0),
          hireDate: String(obj.Hire_Date || ""),

          // ─── Personal ───
          gender: String(obj.Gender || ""),
          birthDate: String(obj["Birth Date"] || ""),

          // ─── ID Documents ───
          nationalIdSide1: String(obj["National Id Side 1"] || ""),
          nationalIdSide2: String(obj["National ID Side 2"] || ""),

          // ─── Address ───
          homeAddress: String(obj["Home Address"] || ""),
          kebele: String(obj.kebele || ""),
          city: String(obj.City || ""),
          state: String(obj.State || ""),

          // ─── Other ───
          notes: String(obj.Notes || ""),
          photo: String(obj["Profile Picture"] || ""),
          lastSeen: String(obj.Last_Seen || ""),
        };
      })
      // ✅ Only active employees
      .filter(
        (e) =>
          e.status.toLowerCase() !== "inactive" &&
          e.status.toLowerCase() !== "suspended" &&
          e.name.trim() !== "" &&
          e.email.trim() !== ""
      );

    return NextResponse.json({ employees, total: employees.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
