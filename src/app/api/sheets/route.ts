import { NextRequest, NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }

  try {
    const sheet = await getSheet(name);
    const rows = await sheet.getRows();
    const data = rows.map((r) => r.toObject());
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`API Error in /api/sheets for "${name}":`, e);
    return NextResponse.json({ error: e.message || "Failed to fetch sheet data" }, { status: 500 });
  }
}
