// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  uploadFile,
  generateKey,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOC_SIZE,
} from "@/lib/r2-client";
import { normalizeRole } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = String(formData.get("folder") || "uploads");
    const type = String(formData.get("type") || "image"); // "image" | "document"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ─── Validate size ───
    const maxSize = type === "document" ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max ${(maxSize / 1024 / 1024).toFixed(
            1
          )}MB allowed`,
        },
        { status: 400 }
      );
    }

    // ─── Validate type ───
    const allowed =
      type === "document" ? ALLOWED_DOC_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.includes(file.type as any)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // ─── Upload ───
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = generateKey(folder, file.name);

    const result = await uploadFile(buffer, key, file.type);

    return NextResponse.json({
      ok: true,
      key: result.key,
      url: result.url,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: e.message || "Upload failed" },
      { status: 500 }
    );
  }
}
