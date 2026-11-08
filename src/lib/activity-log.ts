// src/lib/activity-log.ts
"use client";

import { ActivityAction, ActivityLogEntry } from "./activity-log-types";

const STORAGE_KEY = "ccc_activity_log_v1";
const MAX_ENTRIES = 500;

// ═══════════════════════════════════════════════════════════════
// READ: Get all activity log entries (newest first)
// ═══════════════════════════════════════════════════════════════
export function getActivityLog(): ActivityLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// WRITE: Append a new activity log entry
// ═══════════════════════════════════════════════════════════════
export function logActivity(
  action: ActivityAction,
  module: ActivityLogEntry["module"],
  payload: {
    userId?: string;
    userName?: string;
    userRole?: string;
    targetId?: string;
    targetLabel?: string;
    details?: string;
    metadata?: Record<string, any>;
  } = {}
): ActivityLogEntry {
  const entry: ActivityLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action,
    module,
    userId: payload.userId || "unknown",
    userName:
      payload.userName ||
      (typeof window !== "undefined"
        ? localStorage.getItem("userName") ||
          localStorage.getItem("userEmail") ||
          "Unknown User"
        : "Unknown User"),
    userRole: payload.userRole || "unknown",
    targetId: payload.targetId,
    targetLabel: payload.targetLabel,
    details: payload.details,
    metadata: payload.metadata,
  };

  try {
    const existing = getActivityLog();
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // ✅ Dispatch custom event so other components can react
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("activity-log:changed", { detail: entry })
      );
    }
  } catch (e) {
    console.error("Failed to write activity log", e);
  }

  return entry;
}

// ═══════════════════════════════════════════════════════════════
// DELETE: Remove a single entry by id
// ═══════════════════════════════════════════════════════════════
export function deleteActivityLogEntry(id: string): boolean {
  try {
    const existing = getActivityLog();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // ✅ Notify listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("activity-log:changed", { detail: { deleted: id } })
      );
    }

    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// CLEAR: Delete all entries
// ═══════════════════════════════════════════════════════════════
export function clearActivityLog(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);

    // ✅ Notify listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("activity-log:changed", { detail: { cleared: true } })
      );
    }

    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS (optional — for filtering & stats)
// ═══════════════════════════════════════════════════════════════

/**
 * Get entries filtered by module
 */
export function getActivityLogByModule(
  module: ActivityLogEntry["module"]
): ActivityLogEntry[] {
  return getActivityLog().filter((e) => e.module === module);
}

/**
 * Get entries filtered by user
 */
export function getActivityLogByUser(userEmail: string): ActivityLogEntry[] {
  const email = userEmail.toLowerCase();
  return getActivityLog().filter(
    (e) =>
      e.userName.toLowerCase().includes(email) ||
      e.userId.toLowerCase().includes(email)
  );
}

/**
 * Count entries by action (e.g. { "income:create": 5, ... })
 */
export function getActivityLogCounts(): Record<string, number> {
  const log = getActivityLog();
  const counts: Record<string, number> = {};
  for (const e of log) {
    counts[e.action] = (counts[e.action] || 0) + 1;
  }
  return counts;
}

/**
 * Get recent entries (default 10)
 */
export function getRecentActivity(limit = 10): ActivityLogEntry[] {
  return getActivityLog().slice(0, limit);
}
