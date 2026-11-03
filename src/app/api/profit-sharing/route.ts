// src/app/api/profit-sharing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateProfit } from "@/lib/profit-engine";
import { getProfitConfig } from "@/lib/settings";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") || new Date().getFullYear());
    const month = Number(searchParams.get("month") || new Date().getMonth() + 1);

    const config = await getProfitConfig();
    const result = await calculateProfit({ year, month }, config);

    return NextResponse.json({
      year,
      month,
      config,
      calculation: result,
    });
  } catch (e: any) {
    console.error("Profit calc error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
