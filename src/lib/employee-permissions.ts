// src/lib/employee-permissions.ts

// ═══════════════════════════════════════════════════════════════
// 👥 EMPLOYEE/STAFF PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export type EmployeePermissionKey =
  | "canAccessEmployeeDashboard"
  | "canRegisterSale"
  | "canRegisterIncome"
  | "canRegisterInventory"
  | "canViewAnnouncements"
  | "canCreateAnnouncements"
  | "canViewBasicStats";

export interface EmployeePermissions {
  email: string;
  canAccessEmployeeDashboard: boolean;
  canRegisterSale: boolean;
  canRegisterIncome: boolean;
  canRegisterInventory: boolean;
  canViewAnnouncements: boolean;
  canCreateAnnouncements: boolean;
  canViewBasicStats: boolean;
}

// ✅ Safe defaults
export const DEFAULT_EMPLOYEE_PERMISSIONS: Omit<
  EmployeePermissions,
  "email"
> = {
  canAccessEmployeeDashboard: true,
  canRegisterSale: true,
  canRegisterIncome: true,
  canRegisterInventory: true,
  canViewAnnouncements: true,
  canCreateAnnouncements: false,
  canViewBasicStats: true,
};

// ✅ Blocked permissions (ሁልጊዜ false — አይፈቀዱም)
export const EMPLOYEE_BLOCKED_PERMISSIONS = [
  "canViewReports",
  "canPrint",
  "canEditIncome",
  "canDeleteIncome",
  "canEditExpense",
  "canDeleteExpense",
  "canViewActivityLog",
  "canManageStaff",
  "canEditInventory",
] as const;

// ✅ Helper: Is this role an employee/staff role?
export function isEmployeeRole(role: string | undefined | null): boolean {
  const r = String(role || "").toLowerCase();
  return r === "employee" || r === "staff";
}

// ✅ Helper: Can access admin area?
export function canAccessAdminArea(
  role: string | undefined | null
): boolean {
  const r = String(role || "").toLowerCase();
  return r === "owner" || r === "manager";
}

// ✅ Routes
export function getEmployeeHomeRoute(): string {
  return "/employee/dashboard";
}

export function getAdminHomeRoute(): string {
  return "/admin/dashboard";
}

// ✅ Blocked admin routes for employees
export const EMPLOYEE_BLOCKED_ROUTES = [
  "/admin/reports",
  "/admin/analytics",
  "/admin/profit",
  "/admin/income",
  "/admin/expenses",
  "/admin/settings",
  "/admin/staff",
  "/admin/dashboard",
  "/admin/customers",
  "/admin/suppliers",
  "/admin/inventory",
  "/admin/training",
  "/admin/services",
  "/admin/announcements",
] as const;

export function isRouteBlockedForEmployee(route: string): boolean {
  return EMPLOYEE_BLOCKED_ROUTES.some(
    (blocked) => route === blocked || route.startsWith(blocked + "/")
  );
}

// ✅ Alias (backward compat)
export function isEmployeeBlockedFromRoute(route: string): boolean {
  return isRouteBlockedForEmployee(route);
}

// ═══════════════════════════════════════════════════════════════
// ✅ PARSE PERMISSIONS FROM ROW
// ═══════════════════════════════════════════════════════════════
export function parseEmployeePermissions(
  email: string,
  obj: any
): EmployeePermissions {
  const getBool = (keys: string[], fallback: boolean): boolean => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
        return String(obj[k]).toUpperCase() === "TRUE";
      }
    }
    return fallback;
  };

  return {
    email,
    canAccessEmployeeDashboard: getBool(
      ["Can_Access_Employee_Dashboard", "canAccessEmployeeDashboard"],
      true
    ),
    canRegisterSale: getBool(
      ["Can_Register_Sale", "canRegisterSale"],
      true
    ),
    canRegisterIncome: getBool(
      ["Can_Register_Income", "canRegisterIncome"],
      true
    ),
    canRegisterInventory: getBool(
      ["Can_Register_Inventory", "canRegisterInventory"],
      true
    ),
    canViewAnnouncements: getBool(
      ["Can_View_Announcements", "canViewAnnouncements"],
      true
    ),
    canCreateAnnouncements: getBool(
      ["Can_Create_Announcements", "canCreateAnnouncements"],
      false
    ),
    canViewBasicStats: getBool(
      ["Can_View_Basic_Stats", "canViewBasicStats"],
      true
    ),
  };
}
