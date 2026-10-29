// src/lib/export-utils.ts
// ═══════════════════════════════════════════════════════════════
// 📤 EXPORT UTILITIES — shared types & normalizers
// ⚠️  Never re-compute financial fields here.
//     Use calculateLineRevenue / calculateLineProfit when needed.
// ═══════════════════════════════════════════════════════════════

import {
  calculateLineRevenue,
  calculateLineCost,
  calculateLineProfit,
} from "./financial-engine";

export type ExportKind = "sales" | "inventory" | "expenses" | "staff";
export type ExportFormat = "pdf" | "xlsx" | "csv";

export interface ExportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: number; // for PDF
}

export interface ExportPayload {
  kind: ExportKind;
  format: ExportFormat;
  title: string;
  columns: ExportColumn[];
  rows: Record<string, any>[];
  generatedAt: string;
  rangeLabel?: string;
}

// ─── Normalizers ───

export function normalizeSalesRows(sales: any[]) {
  return sales.map((s) => ({
    Invoice: (s as any).invoiceNo || (s as any).Invoice_No || (s as any).salesId || "",
    Date: formatDate((s as any).date || (s as any).Date),
    Customer: (s as any).customerName || (s as any).Customer_Name || "Walk-in",
    Staff: (s as any).staffId || (s as any).Recorded_By || "",
    Quantity: Number((s as any).quantity ?? 0),
    Revenue: round2(calculateLineRevenue(s)),
    Cost: round2(calculateLineCost(s)),
    Profit: round2(calculateLineProfit(s)),
    Method: (s as any).paymentMethod || (s as any).Payment_Method || "Cash",
    Status: (s as any).paymentStatus || (s as any).Payment_Status || "Paid",
  }));
}

export function normalizeInventoryRows(items: any[]) {
  return items.map((i) => ({
    ID: i.id || i.Item_ID || "",
    Name: i.name || i.Item_Name || "",
    Code: i.itemCode || i.Item_Code || "",
    Category: i.category || i.Category || "",
    Unit: i.unitType || i.Unit_Type || "pcs",
    Stock: Number(i.stock ?? i.Stock_Quantity ?? 0),
    Cost: Number(i.costPrice ?? i.Cost_Price ?? 0),
    Price: Number(i.sellingPrice ?? i.Selling_Price ?? 0),
    Margin:
      Number(i.costPrice ?? i.Cost_Price ?? 0) > 0
        ? round2(
            ((Number(i.sellingPrice ?? i.Selling_Price ?? 0) -
              Number(i.costPrice ?? i.Cost_Price ?? 0)) /
              Number(i.costPrice ?? i.Cost_Price ?? 1)) *
              100
          )
        : 0,
    Status: i.status || i.Status || "Active",
  }));
}

export function normalizeExpenseRows(expenses: any[]) {
  return expenses.map((e) => ({
    ID: e.id || e.Expense_ID || "",
    Date: formatDate(e.date || e.Date),
    Category: e.category || e.Category || "General",
    Amount: Number(e.amount ?? e.Amount ?? 0),
    Note: e.description || e.Description || e.Note || "",
    RecordedBy: e.recordedBy || e.Recorded_By || "",
  }));
}

export function normalizeStaffRows(users: any[], employees: any[]) {
  return users.map((u, idx) => {
    const emp = employees.find(
      (e: any) =>
        String(e.email || e["E- mail"] || "").toLowerCase() ===
        String(u.User_Email || "").toLowerCase()
    );
    return {
      ID: emp?.Employee_ID || emp?.id || `USR-${idx + 1}`,
      Name:
        emp?.["Employee_Full Name"] ||
        emp?.fullName ||
        u.User_Name ||
        u.User_Email ||
        "",
      Email: u.User_Email || u.email || "",
      Phone: u["Phone No"] || emp?.["Phone No"] || "",
      Role: u.Role || "staff",
      JobRole: emp?.Job_Role || "",
      Status: u.Status || "Active",
      LastSeen: u.Last_Seen || "",
    };
  });
}

// ─── Column definitions ───

export const EXPORT_COLUMNS: Record<ExportKind, ExportColumn[]> = {
  sales: [
    { key: "Invoice", label: "Invoice", width: 70 },
    { key: "Date", label: "Date", width: 70 },
    { key: "Customer", label: "Customer", width: 90 },
    { key: "Staff", label: "Staff", width: 80 },
    { key: "Quantity", label: "Qty", align: "right", width: 35 },
    { key: "Revenue", label: "Revenue", align: "right", width: 60 },
    { key: "Cost", label: "Cost", align: "right", width: 55 },
    { key: "Profit", label: "Profit", align: "right", width: 55 },
    { key: "Method", label: "Payment", width: 55 },
    { key: "Status", label: "Status", width: 50 },
  ],
  inventory: [
    { key: "ID", label: "ID", width: 60 },
    { key: "Name", label: "Item", width: 110 },
    { key: "Code", label: "Code", width: 65 },
    { key: "Unit", label: "Unit", width: 35 },
    { key: "Stock", label: "Stock", align: "right", width: 40 },
    { key: "Cost", label: "Cost", align: "right", width: 50 },
    { key: "Price", label: "Price", align: "right", width: 50 },
    { key: "Margin", label: "Margin %", align: "right", width: 55 },
    { key: "Status", label: "Status", width: 55 },
  ],
  expenses: [
    { key: "ID", label: "ID", width: 60 },
    { key: "Date", label: "Date", width: 70 },
    { key: "Category", label: "Category", width: 90 },
    { key: "Amount", label: "Amount", align: "right", width: 70 },
    { key: "Note", label: "Note", width: 140 },
    { key: "RecordedBy", label: "By", width: 80 },
  ],
  staff: [
    { key: "ID", label: "ID", width: 60 },
    { key: "Name", label: "Name", width: 110 },
    { key: "Email", label: "Email", width: 140 },
    { key: "Phone", label: "Phone", width: 80 },
    { key: "Role", label: "Role", width: 55 },
    { key: "JobRole", label: "Job", width: 75 },
    { key: "Status", label: "Status", width: 50 },
  ],
};

// ─── Helpers ───

function formatDate(s: any): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  return d.toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
