import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

const BADGES_SHEET = "Badges_TBL";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      // Sheet ከሌለ → ለመጀመሪያ ጊዜ ይፍጠር
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

// ─── GET: የሁሉንም staff badges ስብስብ ───
export async function GET() {
  try {
    const sheet = await getSheet(BADGES_SHEET);
    const rows = await sheet.getRows();
    const all = rows.map((r) => r.toObject());

    // Group by Staff_ID
    const byStaff: Record<string, any[]> = {};
    for (const b of all) {
      if (!byStaff[b.Staff_ID]) byStaff[b.Staff_ID] = [];
      byStaff[b.Staff_ID].push(b);
    }

    return NextResponse.json(byStaff);
  } catch {
    return NextResponse.json({});
  }
}
