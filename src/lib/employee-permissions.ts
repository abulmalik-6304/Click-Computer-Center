// src/lib/employee-permissions.ts
export interface EmployeePermissions {
  email: string;
  canAccessEmployeeDashboard: boolean;
  canRegisterSale: boolean;
  canRegisterIncome: boolean;
  canRegisterInventory: boolean; // 🆕
  canViewAnnouncements: boolean;
  canCreateAnnouncements: boolean;
  canViewReports: boolean; // 🆕 (blocked — ሁልጊዜ false)
  canPrint: boolean; // 🆕 (blocked — ሁልጊዜ false)
  canViewBasicStats: boolean;
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: Omit<
  EmployeePermissions,
  "email"
> = {
  canAccessEmployeeDashboard: true,
  canRegisterSale: true,
  canRegisterIncome: true,
  canRegisterInventory: true, // 🆕
  canViewAnnouncements: true,
  canCreateAnnouncements: false,
  canViewReports: false, // 🆕 ሁልጊዜ false
  canPrint: false, // 🆕 ሁልጊዜ false
  canViewBasicStats: true,
};

export type EmployeePermissionKey =
  | "canAccessEmployeeDashboard"
  | "canRegisterSale"
  | "canRegisterIncome"
  | "canRegisterInventory" // 🆕
  | "canViewAnnouncements"
  | "canCreateAnnouncements"
  | "canViewReports" // 🆕
  | "canPrint" // 🆕
  | "canViewBasicStats";

// parseEmployeePermissions ውስጥ ጨምር
return {
  // ... ያሉት
  canViewReports: getBool(
    ["Can_View_Reports", "canViewReports"],
    false
  ),
  canPrint: getBool(
    ["Can_Print", "canPrint"],
    false
  ),
  canViewBasicStats: getBool(
    ["Can_View_Basic_Stats", "canViewBasicStats"],
    true
  ),
};
