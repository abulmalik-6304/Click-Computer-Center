// src/lib/activity-log.ts
// ═══════════════════════════════════════════════════════════════
// 📝 ACTIVITY LOG — Fire-and-forget action logger
// ═══════════════════════════════════════════════════════════════

export type ActivityAction =
  | "income:create"
  | "income:update"
  | "income:delete"
  | "income:print"
  | "sales:create"
  | "sales:void"
  | "sales:refund"
  | "sales:delete"
  | "inventory:create"
  | "inventory:update"
  | "inventory:delete"
  | "customer:create"
  | "customer:update"
  | "customer:delete"
  | "supplier:create"
  | "supplier:update"
  | "supplier:delete"
  | "staff:create"
  | "staff:update"
  | "staff:delete"
  | "settings:update"
  | string;

export interface LogActivityOptions {
  targetId?: string;
  targetLabel?: string;
  details?: string;
  userRole?: string;
}

/**
 * Log an activity to the server (fire-and-forget).
 * Never throws — logging failures are silently ignored.
 */
export function logActivity(
  action: ActivityAction,
  module: string,
  opts: LogActivityOptions = {}
): void {
  // Fire and forget — don't await, don't throw
  (async () => {
    try {
      // Get user info from localStorage (client-side only)
      let userName = "";
      let userEmail = "";
      if (typeof window !== "undefined") {
        userName = localStorage.getItem("userName") || "";
        userEmail = localStorage.getItem("userEmail") || "";
      }

      await fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          module,
          targetId: opts.targetId || "",
          targetLabel: opts.targetLabel || "",
          details: opts.details || "",
          userRole: opts.userRole || "",
          userName,
          userEmail,
          timestamp: new Date().toISOString(),
        }),
        // Don't fail the caller if logging fails
        keepalive: true,
      });
    } catch (e) {
      // ✅ Silent — logging is non-critical
      console.warn("Activity log failed (non-critical):", e);
    }
  })();
}
