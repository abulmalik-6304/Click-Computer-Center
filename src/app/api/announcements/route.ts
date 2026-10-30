// src/app/api/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

const ANN_SHEET = "Announcements_TBL";

export const revalidate = 0;

// ─── GET: ሁሉንም ማስታወቂያዎች ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const role = String((session.user as any).role || "staff").toLowerCase();

    const sheet = await getSheet(ANN_SHEET);
    const rows = await sheet.getRows();
    let all = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Announcement_ID || ""),
        date: String(obj.Date || ""),
        image: String(obj.Image || ""),
        title: String(obj.Title || ""),
        message: String(obj.Message || ""),
        targetRole: String(obj.Target_Role || "all").toLowerCase(),
        status: String(obj.Status || "Active").toLowerCase(),
      };
    });

    // Filter by role (staff የራሳቸውን ብቻ ያያሉ)
    if (role === "staff") {
      all = all.filter((a) => a.targetRole === "all" || a.targetRole === "staff");
    }

    // Filter by status
    if (status !== "all") {
      all = all.filter((a) => a.status === status);
    }

    // Sort newest first
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ announcements: all });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ announcements: [] });
    }
    console.error("Announcements GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: አዲስ ማስታወቂያ ፍጠር ───
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
    const { title, message, image, targetRole, status } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    let sheet;
    try {
      sheet = await getSheet(ANN_SHEET);
    } catch {
      const { getDoc } = await import("@/lib/google-sheets");
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: ANN_SHEET,
        headerValues: [
          "Announcement_ID",
          "Date",
          "Image",
          "Title",
          "Message",
          "Target_Role",
          "Status",
        ],
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `ANN-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Announcement_ID: id,
      Date: new Date().toISOString(),
      Image: image || "",
      Title: title,
      Message: message,
      Target_Role: targetRole || "all",
      Status: status || "Active",
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error("Announcement POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── PUT: ማሻሻል ───
export async function PUT(req: NextRequest) {
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
    const { id, title, message, image, targetRole, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(ANN_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Announcement_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (title !== undefined) row.set("Title", title);
    if (message !== undefined) row.set("Message", message);
    if (image !== undefined) row.set("Image", image);
    if (targetRole !== undefined) row.set("Target_Role", targetRole);
    if (status !== undefined) row.set("Status", status);
    await row.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: ማጥፋት (soft → Archived) ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = String((session.user as any).role || "staff").toLowerCase();
  if (!["owner", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(ANN_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Announcement_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    row.set("Status", "Archived");
    await row.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
