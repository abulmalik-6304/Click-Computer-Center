// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = String(token.role || "staff").toLowerCase();

  // ═══════════════════════════════════════════════════════════════
  // ✅ SETTINGS — Owner + Manager ሁለቱም ይፈቀዳሉ
  // ═══════════════════════════════════════════════════════════════
  if (pathname.startsWith("/admin/settings")) {
    if (role !== "owner" && role !== "manager") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ STAFF — Owner + Manager
  // ═══════════════════════════════════════════════════════════════
  if (pathname.startsWith("/admin/staff")) {
    if (role !== "owner" && role !== "manager") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ EMPLOYEE/STAFF — ወደ employee dashboard ይሂዱ
  // ═══════════════════════════════════════════════════════════════
  if (role === "employee" || role === "staff") {
    // ከ admin ገጾች ወደ employee dashboard
    if (
      pathname.startsWith("/admin/dashboard") ||
      pathname.startsWith("/admin/settings") ||
      pathname.startsWith("/admin/staff") ||
      pathname.startsWith("/admin/reports") ||
      pathname.startsWith("/admin/income") ||
      pathname.startsWith("/admin/expenses") ||
      pathname.startsWith("/admin/inventory") ||
      pathname.startsWith("/admin/suppliers") ||
      pathname.startsWith("/admin/customers") ||
      pathname.startsWith("/admin/announcements") ||
      pathname.startsWith("/admin/profit-sharing") ||
      pathname.startsWith("/admin/export") ||
      pathname.startsWith("/admin/sales")
    ) {
      return NextResponse.redirect(new URL("/employee/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
