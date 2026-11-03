// src/app/api/settings/profit-sharing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfitConfig, setProfitConfig } from "@/lib/settings";
import { ProfitConfig } from "@/lib/profit-engine";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const config = await getProfitConfig();
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const config: ProfitConfig = body.config;

    if (!config) {
      return NextResponse.json({ error: "Config required" }, { status: 400 });
    }

    if (config.staffSharePercent < 0 || config.staffSharePercent > 100) {
      return NextResponse.json(
        { error: "Staff % must be 0-100" },
        { status: 400 }
      );
    }

    if (config.sharedDivisor < 1) {
      return NextResponse.json(
        { error: "Divisor must be at least 1" },
        { status: 400 }
      );
    }

    const result = await setProfitConfig(
      config,
      session.user?.name ?? session.user?.email ?? ""
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
