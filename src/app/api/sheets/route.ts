import { NextRequest, NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Missing name param" }, { status: 400 });
  }
  try {
    const sheet = await getSheet(name);
    const rows = await sheet.getRows();
    return NextResponse.json(rows.map((r) => r.toObject()));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
