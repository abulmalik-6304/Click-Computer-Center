// src/lib/permissions.ts
// ═══════════════════════════════════════════════════════════════
// 🔐 PERMISSIONS SYSTEM — Owner grants specific permissions to managers
// ═══════════════════════════════════════════════════════════════

import { getSheet, getDoc } from "./google-sheets";
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
};

export type PermissionKey =
  | "canVoid"
  | "canRefund"
  | "canDelete"
  | "canEditInventory"
  | "canExport"
  | "canViewActivity"
  | "canManageStaff"
  | "canViewProfit";

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

    const bool = (v: any) => String(v || "FALSE").toUpperCase() === "TRUE";

    return {
      email: String(row.get("Manager_Email") || ""),
      canVoid: bool(row.get("Can_Void")),
      canRefund: bool(row.get("Can_Refund")),
      canDelete: bool(row.get("Can_Delete")),
      canEditInventory: bool(row.get("Can_Edit_Inventory")),
      canExport: bool(row.get("Can_Export")),
      canViewActivity: bool(row.get("Can_View_Activity")),
      canManageStaff: bool(row.get("Can_Manage_Staff")),
      canViewProfit: bool(row.get("Can_View_Profit")),
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
  const r = String(role || "").toLowerCase().trim();

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
