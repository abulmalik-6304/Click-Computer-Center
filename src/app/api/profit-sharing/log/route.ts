// src/app/api/profit-sharing/log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logReportAction, getReportLog } from "@/lib/profit-report-log";
import { hasPermission } from "@/lib/permissions";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── POST: Log action (print/copy/export) ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  const email = String(session.user?.email || "");

  // ✅ Check permission — anyone with view-profit can log
  const canViewProfit = await hasPermission(email, role, "canViewProfit");
  if (!canViewProfit) {
    return NextResponse.json(
      { error: "No permission to log profit report" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      action,
      month,
      year,
      totalIncome,
      netProfit,
      ownerProfit,
      staffProfit,
    } = body;

    if (!action || !["print", "copy", "export"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await logReportAction({
      action,
      month: Number(month),
      year: Number(year),
      performedBy: session.user?.name ?? "Unknown",
      performedEmail: session.user?.email ?? "",
      role: role,
      totalIncome: Number(totalIncome || 0),
      netProfit: Number(netProfit || 0),
      ownerProfit: Number(ownerProfit || 0),
      staffProfit: Number(staffProfit || 0),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── GET: List log (owner only) ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const logs = await getReportLog(100);
  return NextResponse.json({ logs });
}
