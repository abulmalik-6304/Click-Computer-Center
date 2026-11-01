// src/lib/sales-activity.ts
// ═══════════════════════════════════════════════════════════════
// 📝 SALES ACTIVITY LOG — tracks who edited/deleted sales
// ═══════════════════════════════════════════════════════════════

export const SALES_ACTIVITY_SHEET = "Sales_Activity_TBL";

export const SALES_ACTIVITY_HEADERS = [
  "Log_ID",
  "Date",
  "Action",
  "Sales_ID",
  "Invoice_No",
  "Customer_Name",
  "Performed_By",
  "Role",
  "Details",
  "Old_Value",
  "New_Value",
];

export interface SalesActivityLog {
  id: string;
  date: string;
  action: string;
  salesId: string;
  invoiceNo: string;
  customerName: string;
  performedBy: string;
  role: string;
  details: string;
  oldValue: string;
  newValue: string;
}

export const SALES_ACTION_ICONS: Record<string, string> = {
  create: "➕",
  edit: "✏️",
  delete: "🗑",
  completed: "✅",
  draft: "📝",
  print: "🖨",
  share: "🔗",
};

export const SALES_ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  edit: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  print: "bg-slate-100 text-slate-700",
  share: "bg-orange-100 text-orange-700",
};
