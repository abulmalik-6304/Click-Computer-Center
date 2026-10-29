// src/lib/staff-control.ts

export type StaffStatus = "active" | "inactive" | "suspended";

export function normalizeStatus(raw: string | undefined | null): StaffStatus {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "active") return "active";
  if (s === "suspended") return "suspended";
  return "inactive";
}

export function isActive(raw: string | undefined | null): boolean {
  return normalizeStatus(raw) === "active";
}

export function canManage(
  callerRole: string,
  targetRole: string,
  callerEmail: string,
  targetEmail: string
): { allowed: boolean; reason?: string } {
  const caller = callerRole.toLowerCase();
  const target = targetRole.toLowerCase();

  if (callerEmail.toLowerCase() === targetEmail.toLowerCase()) {
    return { allowed: false, reason: "You cannot manage your own account" };
  }
  if (caller === "owner") return { allowed: true };
  if (caller === "manager") {
    if (target === "staff") return { allowed: true };
    return { allowed: false, reason: "Managers can only manage staff" };
  }
  return { allowed: false, reason: "Insufficient permissions" };
}

export function canChangeRole(
  callerRole: string,
  callerEmail: string,
  targetEmail: string
): { allowed: boolean; reason?: string } {
  if (callerRole.toLowerCase() === "owner") {
    if (callerEmail.toLowerCase() === targetEmail.toLowerCase()) {
      return { allowed: false, reason: "You cannot change your own role" };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "Only owners can change roles" };
}

export const ROLE_COLORS: Record<string, string> = {
  owner: "bg-orange-100 text-orange-700",
  manager: "bg-emerald-100 text-emerald-700",
  staff: "bg-slate-100 text-slate-700",
};

export const STATUS_COLORS: Record<StaffStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
  suspended: "bg-red-100 text-red-700",
};

export const STATUS_LABELS: Record<StaffStatus, string> = {
  active: "✅ Active",
  inactive: "⚪ Inactive",
  suspended: "🚫 Suspended",
};
