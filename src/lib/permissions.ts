// src/lib/permissions.ts
// ═══════════════════════════════════════════════════════════════
// 🔐 PERMISSIONS SYSTEM — Owner grants specific permissions to managers
// ═══════════════════════════════════════════════════════════════

import { getSheet, getDoc } from "./google-sheets";
import { normalizeRole } from "./roles";
// ✅ We use getSheet (not getCachedRows) for settings — always fresh

const PERMISSIONS_SHEET = "Permissions_TBL";

export const PERMISSION_HEADERS = [
  "Permission_ID",
  "Manager_Email",
  "Can_Void",
  "Can_Refund",
  "Can_Delete",
  "Can_Edit_Inventory",
  "Can_Export",
  "Can_View_Activity",
  "Can_Manage_Staff",
  "Can_View_Profit",
  "Can_Print_Customers", // ✅ አዲስ
  "Can_Print_Suppliers", // ✅ አዲስ
  "Updated_By",
  "Updated_At",
];

export interface ManagerPermissions {
  email: string;
  canVoid: boolean;
  canRefund: boolean;
  canDelete: boolean;
  canEditInventory: boolean;
  canExport: boolean;
  canViewActivity: boolean;
  canManageStaff: boolean;
  canViewProfit: boolean;
  canPrintCustomers: boolean; // ✅ አዲስ
  canPrintSuppliers: boolean; // ✅ አዲስ
}

export const DEFAULT_PERMISSIONS: Omit<ManagerPermissions, "email"> = {
  canVoid: false,
  canRefund: false,
  canDelete: false,
  canEditInventory: false,
  canExport: false,
  canViewActivity: false,
  canManageStaff: false,
  canViewProfit: false,
  canPrintCustomers: false, // ✅ አዲስ
  canPrintSuppliers: false, // ✅ አዲስ
};

export type PermissionKey =
  | "canVoid"
  | "canRefund"
  | "canDelete"
  | "canEditInventory"
  | "canExport"
  | "canViewActivity"
  | "canManageStaff"
  | "canViewProfit"
  | "canPrintCustomers" // ✅ አዲስ
  | "canPrintSuppliers"; // ✅ አዲስ

// ═══════════════════════════════════════════════════════════════
// GET: Load permissions for a manager
// ═══════════════════════════════════════════════════════════════
export async function getManagerPermissions(
  email: string
): Promise<ManagerPermissions | null> {
  if (!email) return null;

  try {
    const sheet = await getSheet(PERMISSIONS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Manager_Email")).toLowerCase() === email.toLowerCase()
    );
    if (!row) return null;

    const obj = row.toObject() as any;
    const getBool = (keys: string[]): boolean => {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
          return String(obj[k]).toUpperCase() === "TRUE";
        }
      }
      return false;
    };

    return {
      email: String(obj.Manager_Email || ""),
      canVoid: getBool(["Can_Void", "CanVoid", "canVoid"]),
      canRefund: getBool(["Can_Refund", "CanRefund", "canRefund"]),
      canDelete: getBool(["Can_Delete", "CanDelete", "canDelete"]),
      canEditInventory: getBool(["Can_Edit_Inventory", "CanEditInventory", "canEditInventory"]),
      canExport: getBool(["Can_Export", "CanExport", "canExport"]),
      canViewActivity: getBool(["Can_View_Activity", "CanViewActivity", "canViewActivity"]),
      canManageStaff: getBool(["Can_Manage_Staff", "CanManageStaff", "canManageStaff"]),
      canViewProfit: getBool(["Can_View_Profit", "CanViewProfit", "canViewProfit"]),
      canPrintCustomers: getBool(["Can_Print_Customers", "CanPrintCustomers", "canPrintCustomers"]), // ✅
      canPrintSuppliers: getBool(["Can_Print_Suppliers", "CanPrintSuppliers", "canPrintSuppliers"]), // ✅
    };
  } catch (e: any) {
    if (String(e.message).includes("not found")) return null;
    console.error("Get permissions error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SET: Save permissions
// ═══════════════════════════════════════════════════════════════
export async function setManagerPermissions(
  permissions: ManagerPermissions,
  updatedBy: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    let sheet;
    try {
      sheet = await getSheet(PERMISSIONS_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: PERMISSIONS_SHEET,
        headerValues: PERMISSION_HEADERS,
      });
    }

    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) =>
        String(r.get("Manager_Email")).toLowerCase() ===
        permissions.email.toLowerCase()
    );

    const fields: Record<string, string> = {
      Can_Void: permissions.canVoid ? "TRUE" : "FALSE",
      Can_Refund: permissions.canRefund ? "TRUE" : "FALSE",
      Can_Delete: permissions.canDelete ? "TRUE" : "FALSE",
      Can_Edit_Inventory: permissions.canEditInventory ? "TRUE" : "FALSE",
      Can_Export: permissions.canExport ? "TRUE" : "FALSE",
      Can_View_Activity: permissions.canViewActivity ? "TRUE" : "FALSE",
      Can_Manage_Staff: permissions.canManageStaff ? "TRUE" : "FALSE",
      Can_View_Profit: permissions.canViewProfit ? "TRUE" : "FALSE",
      Can_Print_Customers: permissions.canPrintCustomers ? "TRUE" : "FALSE", // ✅
      Can_Print_Suppliers: permissions.canPrintSuppliers ? "TRUE" : "FALSE", // ✅
    };

    if (existing) {
      for (const [k, v] of Object.entries(fields)) existing.set(k, v);
      existing.set("Updated_By", updatedBy);
      existing.set("Updated_At", new Date().toISOString());
      await existing.save();
    } else {
      await sheet.addRow({
        Permission_ID: `PERM-${String(rows.length + 1).padStart(4, "0")}`,
        Manager_Email: permissions.email,
        ...fields,
        Updated_By: updatedBy,
        Updated_At: new Date().toISOString(),
      });
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK: Has permission
// ═══════════════════════════════════════════════════════════════
export async function hasPermission(
  email: string,
  role: string,
  permission: PermissionKey
): Promise<boolean> {
  // ✅ Normalize role — "Admin" → "owner"
  const r = normalizeRole(role);

  // Owner always has all permissions
  if (r === "owner") return true;

  // Manager needs explicit grant
  if (r === "manager") {
    const perms = await getManagerPermissions(email);
    if (!perms) return false;
    return perms[permission];
  }

  // Staff/Employee never has these permissions
  return false;
}
