// src/lib/activity-log.ts
"use client";

import { ActivityAction, ActivityLogEntry } from "./activity-log-types";

const STORAGE_KEY = "ccc_activity_log_v1";
const MAX_ENTRIES = 500;

/** Read all log entries (newest first) */
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

/** Append a log entry */
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
        ? localStorage.getItem("userName") || "Unknown User"
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
  } catch (e) {
    console.error("Failed to write activity log", e);
  }

  return entry;
}

/** Delete a single entry by id */
export function deleteActivityLogEntry(id: string): boolean {
  try {
    const existing = getActivityLog();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

/** Clear entire log */
export function clearActivityLog(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
