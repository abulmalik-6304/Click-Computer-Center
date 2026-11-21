// src/app/api/admin/digital-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import { deleteFile } from "@/lib/r2-client";

const PRODUCTS_SHEET = "Digital_Products_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List all digital products ───
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
    const sheet = await getSheet(PRODUCTS_SHEET);
    const rows = await sheet.getRows();

    const products = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Product_ID || ""),
          title: String(o.Title || ""),
          description: String(o.Description || ""),
          price: Number(o.Price || 0),
          category: String(o.Category || ""),
          thumbnailImage: String(o.Thumbnail_Image || ""),
          fileUrl: String(o.File_URL || ""),
          fileKey: String(o.File_Key || ""),
          fileSize: Number(o.File_Size || 0),
          fileType: String(o.File_Type || ""),
          showOnWeb: String(o.Show_On_Web || "").toUpperCase() === "TRUE",
          featured: String(o.Featured || "").toUpperCase() === "TRUE",
          downloadLimit: Number(o.Download_Limit || 0),
          createdBy: String(o.Created_By || ""),
          createdAt: String(o.Created_At || ""),
          status: String(o.Status || "active").toLowerCase(),
        };
      })
      .filter((p) => p.status === "active")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ products });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ products: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create digital product ───
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
    const { title, description, price, category, thumbnailImage, fileUrl, fileKey, fileSize, fileType, downloadLimit } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!fileUrl) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (Number(price) < 0) {
      return NextResponse.json({ error: "Price must be >= 0" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(PRODUCTS_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: PRODUCTS_SHEET,
        headerValues: [
          "Product_ID", "Title", "Description", "Price", "Category",
          "Thumbnail_Image", "File_URL", "File_Key", "File_Size", "File_Type",
          "Show_On_Web", "Featured", "Download_Limit", "Created_By", "Created_At", "Status",
        ],
      });
    }

    const rows = await sheet.getRows();
    const existingIds = rows.map((r) => String(r.get("Product_ID") || "")).filter((id) => id.startsWith("DIG-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("DIG-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `DIG-${String(maxNum + 1).padStart(4, "0")}`;

    await sheet.addRow({
      Product_ID: newId,
      Title: title.trim(),
      Description: description?.trim() || "",
      Price: Number(price) || 0,
      Category: category || "ebook",
      Thumbnail_Image: thumbnailImage || "",
      File_URL: fileUrl,
      File_Key: fileKey || "",
      File_Size: Number(fileSize) || 0,
      File_Type: fileType || "",
      Show_On_Web: "TRUE",
      Featured: "FALSE",
      Download_Limit: Number(downloadLimit) || 0,
      Created_By: session.user?.name ?? session.user?.email ?? "",
      Created_At: new Date().toISOString(),
      Status: "active",
    });

    return NextResponse.json({ ok: true, id: newId });
  } catch (e: any) {
    console.error("Digital product POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── PUT: Update ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const sheet = await getSheet(PRODUCTS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Product_ID")) === String(body.id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.title !== undefined) row.set("Title", body.title);
    if (body.description !== undefined) row.set("Description", body.description);
    if (body.price !== undefined) row.set("Price", Number(body.price));
    if (body.category !== undefined) row.set("Category", body.category);
    if (body.thumbnailImage !== undefined) row.set("Thumbnail_Image", body.thumbnailImage);
    if (body.downloadLimit !== undefined) row.set("Download_Limit", Number(body.downloadLimit));
    if (body.showOnWeb !== undefined) row.set("Show_On_Web", body.showOnWeb ? "TRUE" : "FALSE");
    if (body.featured !== undefined) row.set("Featured", body.featured ? "TRUE" : "FALSE");
    if (body.status !== undefined) row.set("Status", body.status);

    await row.save();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: Archive + optional R2 delete ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, deleteFile: shouldDelete } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const sheet = await getSheet(PRODUCTS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Product_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (shouldDelete) {
      const key = String(row.get("File_Key") || "");
      if (key) await deleteFile(key);
    }

    row.set("Status", "archived");
    await row.save();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
