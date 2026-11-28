// src/app/api/auth/customer/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  registerCustomer,
  loginCustomer,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/customer-auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await registerCustomer(body);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Auto-login after register
    const login = await loginCustomer(body.email, body.password);
    if (login.ok && login.token) {
      const res = NextResponse.json({
        ok: true,
        customer: login.customer,
      });
      res.cookies.set(COOKIE_NAME, login.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      return res;
    }

    return NextResponse.json({ ok: true, customer: result.customer });
  } catch (e: any) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: e.message || "Registration failed" },
      { status: 500 }
    );
  }
}
