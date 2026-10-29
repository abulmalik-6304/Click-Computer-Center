// src/app/admin/staff/page.tsx
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { mapUserRow, mapEmployeeRow, AppUser, Employee } from "@/lib/data-mappers";
import { AwardedBadge } from "@/lib/badge-utils";
import StaffClient from "./StaffClient";

export const revalidate = 0;

export interface StaffDisplay {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  photo: string;
  phone: string;
  jobRole: string;
  lastSeen: string;
}

export default async function StaffPage() {
  let staff: StaffDisplay[] = [];
  let badges: AwardedBadge[] = [];

  try {
    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();
    const users = userRows.map((r) => mapUserRow(r.toObject()));

    let employees: Employee[] = [];
    try {
      const empSheet = await getSheet(SHEETS.EMPLOYEES);
      const empRows = await empSheet.getRows();
      employees = empRows.map((r) => mapEmployeeRow(r.toObject()));
    } catch {
      employees = [];
    }

    staff = users.map((u: AppUser, idx: number) => {
      const emp = employees.find(
        (e) => e.email.toLowerCase() === u.email.toLowerCase()
      );
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

    // Load badges
    try {
      const badgeSheet = await getSheet("Badges_TBL");
      const badgeRows = await badgeSheet.getRows();
      badges = badgeRows.map((r) => ({
        badgeId: String(r.get("Badge_Type") ?? ""),
        staffId: String(r.get("Staff_ID") ?? ""),
        staffName: String(r.get("Staff_Name") ?? ""),
        note: String(r.get("Note") ?? ""),
        assignedBy: String(r.get("Assigned_By") ?? ""),
        assignedAt: String(r.get("Assigned_At") ?? ""),
      }));
    } catch {
      badges = [];
    }
  } catch (e) {
    console.error("Staff load error:", e);
  }

  return <StaffClient initialStaff={staff} initialBadges={badges} />;
}
