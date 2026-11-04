// src/app/api/auth/update-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { refreshCache } from "@/lib/sheets-cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { profilePicture, userName, phone } = body;

    const sheet = await getSheet(SHEETS.USERS);
    const rows = await sheet.getRows();
    const userRow = rows.find(
      (r) =>
        String(r.get("User_Email")).toLowerCase() ===
        String(session.user?.email).toLowerCase().trim()
    );

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profilePicture !== undefined) {
      userRow.set("Profile Picture", profilePicture);
    }
    if (userName !== undefined) {
      userRow.set("User_Name", userName);
    }
    if (phone !== undefined) {
      userRow.set("Phone No", phone);
    }

    await userRow.save();
    await refreshCache(SHEETS.USERS);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
