// src/lib/inventory-activity.ts
// ═══════════════════════════════════════════════════════════════
// 📝 INVENTORY ACTIVITY LOG — tracks who edited/deleted what
// Stored in Google Sheet: Inventory_Activity_TBL
// ═══════════════════════════════════════════════════════════════

export const ACTIVITY_SHEET = "Inventory_Activity_TBL";

export const ACTIVITY_HEADERS = [
  "Log_ID",
  "Date",
  "Action",
  "Item_ID",
  "Item_Name",
  "Performed_By",
  "Role",
  "Details",
  "Old_Value",
  "New_Value",
];

export type ActivityAction = "create" | "edit" | "delete" | "stock-in" | "archive";

export interface ActivityLog {
  id: string;
  date: string;
  action: ActivityAction;
  itemId: string;
  itemName: string;
  performedBy: string;
  role: string;
  details: string;
  oldValue: string;
  newValue: string;
}

export const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  edit: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  "stock-in": "bg-orange-100 text-orange-700",
  archive: "bg-slate-100 text-slate-700",
};

export const ACTION_ICONS: Record<string, string> = {
  create: "➕",
  edit: "✏️",
  delete: "🗑",
  "stock-in": "📥",
  archive: "📦",
};
