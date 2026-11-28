// src/app/api/auth/customer/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerToken,
  getCustomerById,
  COOKIE_NAME,
} from "@/lib/customer-auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ customer: null });
    }

    const verified = await verifyCustomerToken(token);
    if (!verified.valid || !verified.customerId) {
      return NextResponse.json({ customer: null });
    }

    const customer = await getCustomerById(verified.customerId);
    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ customer: null });
  }
}
