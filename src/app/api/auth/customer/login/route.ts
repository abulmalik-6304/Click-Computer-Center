// src/app/api/auth/customer/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loginCustomer, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/customer-auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await loginCustomer(body.email, body.password);

    if (!result.ok || !result.token) {
      return NextResponse.json(
        { error: result.error || "Login failed" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      customer: result.customer,
    });

    res.cookies.set(COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Login failed" },
      { status: 500 }
    );
  }
}
