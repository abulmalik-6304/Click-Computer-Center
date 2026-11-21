// src/app/api/public/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheet, getDoc } from "@/lib/google-sheets";

const SHEET = "Contact_Messages_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    // ─── Validation ───
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }
    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }
    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // ─── Get or create sheet ───
    let sheet;
    try {
      sheet = await getSheet(SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SHEET,
        headerValues: [
          "Message_ID",
          "Name",
          "Email",
          "Phone",
          "Subject",
          "Message",
          "Date",
          "Status",
        ],
      });
    }

    // ─── Generate ID ───
    const rows = await sheet.getRows();
    const existingIds = rows
      .map((r) => String(r.get("Message_ID") || ""))
      .filter((id) => id.startsWith("MSG-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("MSG-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `MSG-${String(maxNum + 1).padStart(4, "0")}`;

    // ─── Save ───
    await sheet.addRow({
      Message_ID: newId,
      Name: name.trim(),
      Email: email?.trim() || "",
      Phone: phone.trim(),
      Subject: subject.trim(),
      Message: message.trim(),
      Date: new Date().toISOString(),
      Status: "new",
    });

    return NextResponse.json({ ok: true, id: newId });
  } catch (e: any) {
    console.error("Contact form error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
