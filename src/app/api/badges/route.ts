// src/app/api/badges/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet } from "@/lib/google-sheets";
import { AwardedBadge } from "@/lib/badge-utils";

const BADGES_SHEET = "Badges_TBL";

// ─── GET: የሁሉንም staff badges ስብስብ (grouped by staffId) ───
export async function GET() {
  try {
    const sheet = await getSheet(BADGES_SHEET);
    const rows = await sheet.getRows();
    const all: AwardedBadge[] = rows.map((r) => ({
      badgeId: String(r.get("Badge_Type") ?? ""),
      staffId: String(r.get("Staff_ID") ?? ""),
      staffName: String(r.get("Staff_Name") ?? ""),
      note: String(r.get("Note") ?? ""),
      assignedBy: String(r.get("Assigned_By") ?? ""),
      assignedAt: String(r.get("Assigned_At") ?? ""),
    }));

    // Group by staffId
    const grouped: Record<string, AwardedBadge[]> = {};
    for (const b of all) {
      if (!grouped[b.staffId]) grouped[b.staffId] = [];
      grouped[b.staffId].push(b);
    }
    for (const k of Object.keys(grouped)) {
      grouped[k].sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
      );
    }
    return NextResponse.json({ ok: true, byStaff: grouped, all });
  } catch (e: any) {
    // ሺቱ ከሌለ → ባዶ መመለስ (badge ገና አልተሰጠም)
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ ok: true, byStaff: {}, all: [] });
    }
    console.error("Badges GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: አዲስ badge መስጠት ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = String((session.user as any).role || "staff").toLowerCase();
  if (!["owner", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { staffId, staffName, badges, note, assignedAt } = body;

    if (!staffId || !Array.isArray(badges) || badges.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(BADGES_SHEET);
    } catch {
      // ሺቱ ከሌለ → ፍጠር
      const { getDoc } = await import("@/lib/google-sheets");
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: BADGES_SHEET,
        headerValues: [
          "Badge_ID",
          "Staff_ID",
          "Staff_Name",
          "Badge_Type",
          "Note",
          "Assigned_By",
          "Assigned_At",
        ],
      });
    }

    const rows = await sheet.getRows();
    let counter = rows.length;

    for (const badge of badges) {
      counter++;
      await sheet.addRow({
        Badge_ID: `BDG-${String(counter).padStart(4, "0")}`,
        Staff_ID: staffId,
        Staff_Name: staffName,
        Badge_Type: badge,
        Note: note || "",
        Assigned_By: session.user?.name ?? session.user?.email ?? "",
        Assigned_At: assignedAt || new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, awarded: badges.length });
  } catch (e: any) {
    console.error("Badge award error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
