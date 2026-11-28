// src/app/api/auth/customer/logout/route.ts
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/customer-auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
