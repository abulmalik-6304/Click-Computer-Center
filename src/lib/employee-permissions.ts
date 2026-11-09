// src/lib/employee-permissions.ts

// ═══════════════════════════════════════════════════════════════
// 👥 EMPLOYEE/STAFF PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export type EmployeePermissionKey =
  | "canAccessEmployeeDashboard"
  | "canRegisterSale"
  | "canRegisterIncome"
  | "canViewAnnouncements"
  | "canCreateAnnouncements"
  | "canViewReports"
  | "canPrint"
  | "canViewBasicStats";

export interface EmployeePermissions {
  email: string;
  canAccessEmployeeDashboard: boolean;
  canRegisterSale: boolean;
  canRegisterIncome: boolean;
  canViewAnnouncements: boolean;
  canCreateAnnouncements: boolean;
  canViewReports: boolean; // ✅ አዲስ
  canPrint: boolean; // ✅ አዲስ
  canViewBasicStats: boolean; // ✅ አዲስ
}

// ✅ Safe defaults
export const DEFAULT_EMPLOYEE_PERMISSIONS: Omit<
  EmployeePermissions,
  "email"
> = {
  canAccessEmployeeDashboard: true,
  canRegisterSale: true,
  canRegisterIncome: true,
  canViewAnnouncements: true,
  canCreateAnnouncements: false,
  canViewReports: false, // 🔒 ሁልጊዜ false
  canPrint: false, // 🔒 ሁልጊዜ false
  canViewBasicStats: true,
};

// ✅ Hard-blocked permissions (አይፈቀዱም — ሁልጊዜ false)
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

// ✅ Helper: Check if user can access admin dashboard
export function canAccessAdminArea(role: string | undefined | null): boolean {
  const r = String(role || "").toLowerCase();
  return r === "owner" || r === "manager";
}

// ✅ Helper: Default routes
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

// ✅ Helper: Is this route blocked for employees?
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
    canViewAnnouncements: getBool(
      ["Can_View_Announcements", "canViewAnnouncements"],
      true
    ),
    canCreateAnnouncements: getBool(
      ["Can_Create_Announcements", "canCreateAnnouncements"],
      false
    ),
    canViewReports: getBool(
      ["Can_View_Reports", "canViewReports"],
      false // 🔒 ሁልጊዜ false
    ),
    canPrint: getBool(
      ["Can_Print", "canPrint"],
      false // 🔒 ሁልጊዜ false
    ),
    canViewBasicStats: getBool(
      ["Can_View_Basic_Stats", "canViewBasicStats"],
      true
    ),
  };
}
