// src/app/admin/staff/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCachedRows } from "@/lib/sheets-cache";
import { SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";
import StaffClient from "./StaffClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "").toLowerCase().trim();

  // ✅ Check permission
  const canManageStaff = await hasPermission(email, role, "canManageStaff");
  if (!canManageStaff) {
    return (
      <div className="p-10 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-4xl mb-3">🚫</p>
          <h1 className="text-xl font-bold text-red-900 mb-2">Access Denied</h1>
          <p className="text-sm text-red-700">
            You don&apos;t have permission to manage staff.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = role === "owner";

  let staff: StaffDisplay[] = [];
  let badges: AwardedBadgeDisplay[] = [];

  try {
    const userData = await getCachedRows(SHEETS.USERS);

    staff = userData.map((obj, idx) => ({
      id: String(obj.User_Email || `USR-${idx + 1}`),
      fullName: String(obj.User_Name || obj.User_Email || "Unknown"),
      email: String(obj.User_Email || "").toLowerCase().trim(),
      role: normalizeRole(obj.Role),
      status: String(obj.Status || "Active"),
      photo: String(obj["Profile Picture"] || ""),
      phone: String(obj["Phone No"] || ""),
      jobRole: String(obj.Role || "staff"),
      lastSeen: String(obj.Last_Seen || ""),
    }));

    // ═══════════════════════════════════════════════════════════════
    // ✅ FILTER STAFF LIST BASED ON CALLER ROLE
    // ═══════════════════════════════════════════════════════════════
    if (isOwner) {
      // Owner: sees everyone EXCEPT themselves
      staff = staff.filter((s) => s.email !== email);
    } else if (role === "manager") {
      // Manager: sees ONLY staff/employee (not owners/managers/self)
      staff = staff.filter(
        (s) =>
          s.email !== email &&
          ["staff", "employee"].includes(s.role)
      );
    } else {
      staff = [];
    }

    // Load badges
    try {
      const badgeData = await getCachedRows("Badges_TBL");
      badges = badgeData.map((obj) => ({
        badgeId: String(obj.Badge_Type || ""),
        staffId: String(obj.Staff_ID || ""),
        staffName: String(obj.Staff_Name || ""),
        note: String(obj.Note || ""),
        assignedBy: String(obj.Assigned_By || ""),
        assignedAt: String(obj.Assigned_At || ""),
      }));
    } catch {
      badges = [];
    }
  } catch (e) {
    console.error("Staff load error:", e);
  }

  return (
    <StaffClient
      initialStaff={staff}
      initialBadges={badges}
      userRole={role}
      userEmail={email}
      isOwner={isOwner}
    />
  );
}
