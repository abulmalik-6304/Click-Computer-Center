// src/lib/staff-control.ts
import { normalizeRole } from "./roles";

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

/**
 * Can caller manage target?
 * - owner: anyone (except self)
 * - manager: employee/staff only
 * - employee/staff: nobody
 */
export function canManage(
  callerRole: string,
  targetRole: string,
  callerEmail: string,
  targetEmail: string
): { allowed: boolean; reason?: string } {
  const caller = normalizeRole(callerRole);
  const target = normalizeRole(targetRole);

  if (callerEmail.toLowerCase() === targetEmail.toLowerCase()) {
    return { allowed: false, reason: "You cannot manage your own account" };
  }
  if (caller === "owner") return { allowed: true };
  if (caller === "manager") {
    // Manager can only manage employee/staff (not owner/manager)
    if (target === "employee" || target === "staff") {
      return { allowed: true };
    }
    return { allowed: false, reason: "Managers can only manage employees" };
  }
  return { allowed: false, reason: "Insufficient permissions" };
}

export function canChangeRole(
  callerRole: string,
  callerEmail: string,
  targetEmail: string
): { allowed: boolean; reason?: string } {
  if (normalizeRole(callerRole) === "owner") {
    if (callerEmail.toLowerCase() === targetEmail.toLowerCase()) {
      return { allowed: false, reason: "You cannot change your own role" };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "Only owners can change roles" };
}

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

// Re-export from roles.ts
export { ROLE_COLORS, normalizeRole, isOnline, lastSeenLabel } from "./roles";
