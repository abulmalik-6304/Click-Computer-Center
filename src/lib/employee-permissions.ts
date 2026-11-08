// src/lib/employee-permissions.ts

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
  canViewReports: boolean;
  canPrint: boolean;
  canViewBasicStats: boolean;
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: Omit<
  EmployeePermissions,
  "email"
> = {
  canAccessEmployeeDashboard: true,
  canRegisterSale: true,
  canRegisterIncome: true,
  canViewAnnouncements: true,
  canCreateAnnouncements: false,
  canViewReports: false, // ✅ ሁልጊዜ false (ሪፖርት እገዳ)
  canPrint: false, // ✅ ሁልጊዜ false (ፕሪንት እገዳ)
  canViewBasicStats: true,
};

// ✅ Helper: Does this role have employee access?
export function hasEmployeeAccess(role: string): boolean {
  const r = String(role || "").toLowerCase();
  return r === "employee" || r === "staff";
}

// ✅ Helper: Check if user can access a specific page
export interface PageAccessCheck {
  route: string;
  requiresPermission: EmployeePermissionKey;
}

export const EMPLOYEE_ROUTE_PERMISSIONS: PageAccessCheck[] = [
  {
    route: "/employee/dashboard",
    requiresPermission: "canAccessEmployeeDashboard",
  },
  { route: "/employee/sale/new", requiresPermission: "canRegisterSale" },
  { route: "/employee/income/new", requiresPermission: "canRegisterIncome" },
  {
    route: "/employee/announcements",
    requiresPermission: "canViewAnnouncements",
  },
];

// ✅ Helper: Check if route is blocked for employee
export function isEmployeeBlockedFromRoute(route: string): boolean {
  const blocked = [
    "/admin/reports",
    "/admin/analytics",
    "/admin/profit",
    "/admin/income", // full income page (employees only use /employee/income/new)
    "/admin/expenses",
    "/admin/settings",
  ];
  return blocked.some((b) => route.startsWith(b));
}
