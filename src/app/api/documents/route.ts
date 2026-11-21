// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import { deleteFile } from "@/lib/r2-client";

const SHEET = "Documents_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ✅ GET: List all documents
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();

    const documents = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Document_ID || ""),
          title: String(o.Title || ""),
          category: String(o.Category || ""),
          description: String(o.Description || ""),
          fileUrl: String(o.File_URL || ""),
          fileKey: String(o.File_Key || ""),
          fileType: String(o.File_Type || ""),
          fileSize: Number(o.File_Size || 0),
          issueDate: String(o.Issue_Date || ""),
          expiryDate: String(o.Expiry_Date || ""),
          uploadedBy: String(o.Uploaded_By || ""),
          uploadedAt: String(o.Uploaded_At || ""),
          tags: String(o.Tags || ""),
          status: String(o.Status || "active").toLowerCase(),
        };
      })
      .filter((d) => d.status === "active")
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

    return NextResponse.json({ documents });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ documents: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ POST: Upload new document
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    if (!body.fileUrl) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SHEET,
        headerValues: [
          "Document_ID",
          "Title",
          "Category",
          "Description",
          "File_URL",
          "File_Key",
          "File_Type",
          "File_Size",
          "Issue_Date",
          "Expiry_Date",
          "Uploaded_By",
          "Uploaded_At",
          "Tags",
          "Status",
        ],
      });
    }

    const rows = await sheet.getRows();
    const existingIds = rows
      .map((r) => String(r.get("Document_ID") || ""))
      .filter((id) => id.startsWith("DOC-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("DOC-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `DOC-${String(maxNum + 1).padStart(4, "0")}`;

    await sheet.addRow({
      Document_ID: newId,
      Title: body.title,
      Category: body.category || "other",
      Description: body.description || "",
      File_URL: body.fileUrl,
      File_Key: body.fileKey || "",
      File_Type: body.fileType || "",
      File_Size: Number(body.fileSize) || 0,
      Issue_Date: body.issueDate || "",
      Expiry_Date: body.expiryDate || "",
      Uploaded_By: session.user?.name ?? session.user?.email ?? "",
      Uploaded_At: new Date().toISOString(),
      Tags: body.tags || "",
      Status: "active",
    });

    return NextResponse.json({ ok: true, id: newId });
  } catch (e: any) {
    console.error("Document POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ PUT: Update document metadata
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Document_ID")) === String(body.id)
    );
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.title !== undefined) row.set("Title", body.title);
    if (body.category !== undefined) row.set("Category", body.category);
    if (body.description !== undefined)
      row.set("Description", body.description);
    if (body.issueDate !== undefined) row.set("Issue_Date", body.issueDate);
    if (body.expiryDate !== undefined) row.set("Expiry_Date", body.expiryDate);
    if (body.tags !== undefined) row.set("Tags", body.tags);

    await row.save();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ DELETE: Archive document (+ optional R2 delete)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, deleteFile: shouldDeleteFile } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Document_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ✅ Optional: Delete from R2
    if (shouldDeleteFile) {
      const key = String(row.get("File_Key") || "");
      if (key) {
        await deleteFile(key);
      }
    }

    // Soft delete → archive
    row.set("Status", "archived");
    await row.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
