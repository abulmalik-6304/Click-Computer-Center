// src/lib/roles.ts
// ═══════════════════════════════════════════════════════════════
// 👥 ROLE NORMALIZATION
// ✅ "Admin" / "Administrator" → "owner"
// ✅ "Employee" / "Staff" → accepted
// ═══════════════════════════════════════════════════════════════

export type AppRole = "owner" | "manager" | "employee" | "staff";

/**
 * Normalize any role string to canonical form.
 * 
 * Accepts:
 *   "Admin", "Administrator", "Owner" → "owner"
 *   "Manager" → "manager"
 *   "Employee" → "employee"
 *   "Staff" → "staff"
 */
export function normalizeRole(raw: string | undefined | null): AppRole {
  const s = String(raw ?? "").toLowerCase().trim();

  // ✅ Owner variants
  if (s === "owner") return "owner";
  if (s === "admin") return "owner";           // ✅ Google Sheet uses "Admin"
  if (s === "administrator") return "owner";   // ✅ Fallback

  // Manager
  if (s === "manager") return "manager";

  // Employee
  if (s === "employee") return "employee";

  // Staff (default for known worker roles)
  if (s === "staff") return "staff";

  // Unknown → default to staff (safe)
  return "staff";
}

/**
 * Is this role an employee-type role?
 */
export function isWorkerRole(raw: string | undefined | null): boolean {
  const r = normalizeRole(raw);
  return r === "employee" || r === "staff";
}

/**
 * Is this role owner or manager?
 */
export function isManagerOrOwner(raw: string | undefined | null): boolean {
  const r = normalizeRole(raw);
  return r === "owner" || r === "manager";
}

/**
 * Display label
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
  return Date.now() - d.getTime() < 5 * 60 * 1000;
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
