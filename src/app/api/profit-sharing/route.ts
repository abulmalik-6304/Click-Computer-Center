// src/app/api/profit-sharing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateProfit } from "@/lib/profit-engine";
import { getProfitConfig } from "@/lib/settings";
import { hasPermission } from "@/lib/permissions";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: Calculate monthly profit ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  const email = String(session.user?.email || "");

  // ✅ Check permission — owner always, manager needs grant
  const canViewProfit = await hasPermission(email, role, "canViewProfit");
  if (!canViewProfit) {
    return NextResponse.json(
      { error: "You don't have permission to view Profit Report" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // GET history
    if (action === "history") {
      const { getProfitSharingHistory } = await import("@/lib/profit-sharing");
      const history = await getProfitSharingHistory();
      return NextResponse.json({ history });
    }

    // GET default split
    if (action === "split") {
      const { getDefaultSplit } = await import("@/lib/profit-sharing");
      const split = await getDefaultSplit();
      return NextResponse.json({ split });
    }

    // GET monthly calculation
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
    console.error("Profit sharing GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Save finalized split ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  const email = String(session.user?.email || "");

  // ✅ Only owner can finalize profit splits
  if (role !== "owner") {
    return NextResponse.json(
      { error: "Only owner can finalize profit splits" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Update default split
    if (action === "update-split") {
      const { setDefaultSplit } = await import("@/lib/profit-sharing");
      const { ownerPercent, managerPercent } = body;
      const result = await setDefaultSplit(
        { ownerPercent, managerPercent },
        session.user?.name ?? session.user?.email ?? ""
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    // Save final split record
    const { year, month, ownerPercent, managerPercent, notes } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month required" },
        { status: 400 }
      );
    }

    // Recalculate to ensure accuracy
    const config = await getProfitConfig();
    const data = await calculateProfit({ year, month }, config);

    const { saveProfitSharingRecord, calculateSplit } = await import(
      "@/lib/profit-sharing"
    );
    const shares = calculateSplit(data.staffProfit + data.ownerProfit, {
      ownerPercent,
      managerPercent,
    });

    const result = await saveProfitSharingRecord(
      {
        month,
        year,
        totalRevenue: data.totalIncome,
        totalCost: data.totalCost,
        totalExpenses: data.totalExpenses,
        netProfit: data.staffProfit + data.ownerProfit,
        ownerPercent,
        managerPercent,
        ownerShare: data.ownerProfit,
        managerShare: data.staffProfit,
        status: "Finalized",
        notes: notes || "",
        createdBy: session.user?.name ?? session.user?.email ?? "",
      },
      session.user?.name ?? session.user?.email ?? ""
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: any) {
    console.error("Profit sharing POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
