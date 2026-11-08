// src/lib/activity-log-types.ts

export type ActivityAction =
  | "income:create"
  | "income:update"
  | "income:delete"
  | "expense:create"
  | "expense:update"
  | "expense:delete"
  | "income:print"
  | "income:export"
  | "login"
  | "logout";

export interface ActivityLogEntry {
  id: string;
  timestamp: string;      // ISO
  action: ActivityAction;
  module: "income" | "expense" | "auth" | "system";
  userId: string;
  userName: string;
  userRole: string;
  targetId?: string;      // income/expense id
  targetLabel?: string;   // income source / expense category
  details?: string;       // description
  metadata?: Record<string, any>;
}
