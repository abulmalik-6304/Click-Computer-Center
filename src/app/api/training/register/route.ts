import { NextRequest, NextResponse } from "next/server";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sheet = await getSheet(SHEETS.TRAINING);
    await sheet.addRow({
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      fullName: body.fullName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      course: body.course ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
