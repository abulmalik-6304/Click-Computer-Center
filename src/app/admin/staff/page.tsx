// src/app/admin/staff/page.tsx
import { getSheet, SHEETS } from "@/lib/google-sheets";
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

export interface AwardedBadgeDisplay {
  badgeId: string;
  staffId: string;
  staffName: string;
  note: string;
  assignedBy: string;
  assignedAt: string;
}

export default async function StaffPage() {
  let staff: StaffDisplay[] = [];
  let badges: AwardedBadgeDisplay[] = [];
  let loadError: string | null = null;

  // ─── Load Users ───
  try {
    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();

    staff = userRows.map((r, idx) => {
      const obj = r.toObject() as any;
      return {
        id: obj.User_Email || `USR-${idx + 1}`,
        fullName: obj.User_Name || obj.User_Email || "Unknown",
        email: String(obj.User_Email || "").toLowerCase().trim(),
        role: String(obj.Role || "staff").toLowerCase(),
        status: String(obj.Status || "Active"),
        photo: String(obj["Profile Picture"] || ""),
        phone: String(obj["Phone No"] || ""),
        jobRole: String(obj.Role || "staff"),
        lastSeen: String(obj.Last_Seen || ""),
      };
    });
  } catch (e: any) {
    console.error("Load staff error:", e.message);
    loadError = e.message;
  }

  // ─── Load Badges (optional) ───
  try {
    const badgeSheet = await getSheet("Badges_TBL");
    const badgeRows = await badgeSheet.getRows();
    badges = badgeRows.map((r) => {
      const obj = r.toObject() as any;
      return {
        badgeId: String(obj.Badge_Type || ""),
        staffId: String(obj.Staff_ID || ""),
        staffName: String(obj.Staff_Name || ""),
        note: String(obj.Note || ""),
        assignedBy: String(obj.Assigned_By || ""),
        assignedAt: String(obj.Assigned_At || ""),
      };
    });
  } catch {
    badges = [];
  }

  // ─── Error state ───
  if (loadError && staff.length === 0) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-red-900 mb-2">⚠️ Could not load staff</h1>
          <p className="text-sm text-red-700 mb-4">
            The User_Access_TBL sheet may be missing or misconfigured.
          </p>
          <details className="text-xs text-red-600">
            <summary className="cursor-pointer">Show technical details</summary>
            <pre className="mt-2 p-3 bg-red-100 rounded whitespace-pre-wrap">{loadError}</pre>
          </details>
        </div>
      </div>
    );
  }

  return <StaffClient initialStaff={staff} initialBadges={badges} />;
}
