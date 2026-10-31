// src/lib/roles.ts
// ═══════════════════════════════════════════════════════════════
// 👥 ROLE NORMALIZATION — accepts both "employee" and "staff"
// ═══════════════════════════════════════════════════════════════

export type AppRole = "owner" | "manager" | "employee" | "staff";

/**
 * Normalize any role string to a canonical form.
 * "Employee" → "employee", "Staff" → "staff", etc.
 */
export function normalizeRole(raw: string | undefined | null): AppRole {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "owner") return "owner";
  if (s === "manager") return "manager";
  if (s === "employee") return "employee";
  return "staff";
}

/**
 * Is this role an employee-type role?
 * Both "employee" and "staff" are treated as worker-level roles.
 */
export function isWorkerRole(raw: string | undefined | null): boolean {
  const r = normalizeRole(raw);
  return r === "employee" || r === "staff";
}

/**
 * Is this role owner or manager? (can approve, edit, etc.)
 */
export function isManagerOrOwner(raw: string | undefined | null): boolean {
  const r = normalizeRole(raw);
  return r === "owner" || r === "manager";
}

/**
 * Can this role view the admin dashboard?
 * Everyone except no-role.
 */
export function canAccessAdmin(raw: string | undefined | null): boolean {
  return normalizeRole(raw) !== ("none" as any);
}

/**
 * Display label for a role
 */
export function roleLabel(raw: string | undefined | null): string {
  const r = normalizeRole(raw);
  if (r === "owner") return "Owner";
  if (r === "manager") return "Manager";
  if (r === "employee") return "Employee";
  return "Staff";
}

/**
 * Role colors for UI
 */
export const ROLE_COLORS: Record<string, string> = {
  owner: "bg-orange-100 text-orange-700",
  manager: "bg-emerald-100 text-emerald-700",
  employee: "bg-slate-100 text-slate-700",
  staff: "bg-slate-100 text-slate-700",
};

/**
 * Is this person online? (last seen within 5 minutes)
 */
export function isOnline(lastSeen: string | undefined | null): boolean {
  if (!lastSeen) return false;
  const d = new Date(lastSeen);
  if (isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < 5 * 60 * 1000; // 5 minutes
}

/**
 * Format "last seen" for display
 */
export function lastSeenLabel(lastSeen: string | undefined | null): string {
  if (!lastSeen) return "Never";
  const d = new Date(lastSeen);
  if (isNaN(d.getTime())) return "Never";

  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}
