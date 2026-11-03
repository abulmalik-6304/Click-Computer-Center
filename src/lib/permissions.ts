// src/lib/permissions.ts
// ═══════════════════════════════════════════════════════════════
// 🔐 PERMISSIONS SYSTEM
// Owner can grant/revoke specific permissions to managers
// ═══════════════════════════════════════════════════════════════

import { getSheet, getDoc } from "./google-sheets";

const PERMISSIONS_SHEET = "Permissions_TBL";

export const PERMISSION_HEADERS = [
  "Permission_ID",
  "Manager_Email",
  "Can_Void",
  "Can_Refund",
  "Can_Delete",
  "Can_Edit_Inventory",
  "Can_Export",
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
}

export async function getManagerPermissions(
  email: string
): Promise<ManagerPermissions | null> {
  try {
    const sheet = await getSheet(PERMISSIONS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Manager_Email")).toLowerCase() === email.toLowerCase()
    );
    if (!row) return null;

    return {
      email: String(row.get("Manager_Email") || ""),
      canVoid: String(row.get("Can_Void") || "FALSE").toUpperCase() === "TRUE",
      canRefund: String(row.get("Can_Refund") || "FALSE").toUpperCase() === "TRUE",
      canDelete: String(row.get("Can_Delete") || "FALSE").toUpperCase() === "TRUE",
      canEditInventory:
        String(row.get("Can_Edit_Inventory") || "FALSE").toUpperCase() === "TRUE",
      canExport:
        String(row.get("Can_Export") || "FALSE").toUpperCase() === "TRUE",
    };
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return null;
    }
    console.error("Get permissions error:", e);
    return null;
  }
}

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

    if (existing) {
      existing.set("Can_Void", permissions.canVoid ? "TRUE" : "FALSE");
      existing.set("Can_Refund", permissions.canRefund ? "TRUE" : "FALSE");
      existing.set("Can_Delete", permissions.canDelete ? "TRUE" : "FALSE");
      existing.set(
        "Can_Edit_Inventory",
        permissions.canEditInventory ? "TRUE" : "FALSE"
      );
      existing.set("Can_Export", permissions.canExport ? "TRUE" : "FALSE");
      existing.set("Updated_By", updatedBy);
      existing.set("Updated_At", new Date().toISOString());
      await existing.save();
    } else {
      await sheet.addRow({
        Permission_ID: `PERM-${String(rows.length + 1).padStart(4, "0")}`,
        Manager_Email: permissions.email,
        Can_Void: permissions.canVoid ? "TRUE" : "FALSE",
        Can_Refund: permissions.canRefund ? "TRUE" : "FALSE",
        Can_Delete: permissions.canDelete ? "TRUE" : "FALSE",
        Can_Edit_Inventory: permissions.canEditInventory ? "TRUE" : "FALSE",
        Can_Export: permissions.canExport ? "TRUE" : "FALSE",
        Updated_By: updatedBy,
        Updated_At: new Date().toISOString(),
      });
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Check if a user has a specific permission.
 * Owner always has all permissions.
 */
export async function hasPermission(
  email: string,
  role: string,
  permission: keyof Omit<ManagerPermissions, "email">
): Promise<boolean> {
  const normalizedRole = String(role || "").toLowerCase().trim();

  // Owner always has all permissions
  if (normalizedRole === "owner") return true;

  // Managers need explicit permission
  if (normalizedRole === "manager") {
    const perms = await getManagerPermissions(email);
    if (!perms) return false;
    return perms[permission];
  }

  // Staff never has these permissions
  return false;
}
