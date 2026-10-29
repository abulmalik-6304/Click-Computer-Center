// src/app/api/staff/list/route.ts
import { NextResponse } from "next/server";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { mapUserRow, mapEmployeeRow, AppUser, Employee } from "@/lib/data-mappers";

export const revalidate = 0;

export async function GET() {
  try {
    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();
    const users = userRows.map((r) => mapUserRow(r.toObject()));

    let employees: Employee[] = [];
    try {
      const empSheet = await getSheet(SHEETS.EMPLOYEES);
      const empRows = await empSheet.getRows();
      employees = empRows.map((r) => mapEmployeeRow(r.toObject()));
    } catch { /* optional */ }

    const staff = users.map((u: AppUser, idx: number) => {
      const emp = employees.find((e) => e.email.toLowerCase() === u.email.toLowerCase());
      return {
        id: emp?.id || `USR-${idx + 1}`,
        fullName: emp?.fullName || u.userName || u.email,
        email: u.email,
        role: u.role,
        status: u.status,
        photo: u.profilePicture || emp?.photo || "",
        phone: u.phone || emp?.phone || "",
        jobRole: emp?.jobRole || u.role,
        lastSeen: u.lastSeen || "",
      };
    });

    return NextResponse.json({ staff });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
