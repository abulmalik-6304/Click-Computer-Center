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

  const role = token.role as string | undefined;
  if (pathname.startsWith("/admin/settings") && role !== "owner") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }
  if (
    pathname.startsWith("/admin/staff") &&
    !["owner", "manager"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
