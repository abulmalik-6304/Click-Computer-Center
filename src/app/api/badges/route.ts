import { NextRequest, NextResponse } from "next/server";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sheet = await getSheet(SHEETS.BADGES);
    await sheet.addRow({
      id: crypto.randomUUID(),
      staffId: body.staffId,
      badges: (body.badges ?? []).join(", "),
      note: body.note ?? "",
      assignedAt: body.assignedAt ?? new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
