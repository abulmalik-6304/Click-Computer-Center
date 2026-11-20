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

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 DEBUG: Check env vars
  // ═══════════════════════════════════════════════════════════════
  console.log("🔍 [UPLOAD] Env check:", {
    hasAccountId: !!process.env.R2_ACCOUNT_ID,
    hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    hasBucket: !!process.env.R2_BUCKET_NAME,
    hasEndpoint: !!process.env.R2_ENDPOINT,
    hasPublicUrl: !!process.env.R2_PUBLIC_URL,
    bucket: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT,
    publicUrl: process.env.R2_PUBLIC_URL,
  });

  // ✅ Validate env vars exist
  const missingVars: string[] = [];
  if (!process.env.R2_ACCOUNT_ID) missingVars.push("R2_ACCOUNT_ID");
  if (!process.env.R2_ACCESS_KEY_ID) missingVars.push("R2_ACCESS_KEY_ID");
  if (!process.env.R2_SECRET_ACCESS_KEY)
    missingVars.push("R2_SECRET_ACCESS_KEY");
  if (!process.env.R2_BUCKET_NAME) missingVars.push("R2_BUCKET_NAME");
  if (!process.env.R2_ENDPOINT) missingVars.push("R2_ENDPOINT");
  if (!process.env.R2_PUBLIC_URL) missingVars.push("R2_PUBLIC_URL");

  if (missingVars.length > 0) {
    return NextResponse.json(
      { error: `Missing env vars: ${missingVars.join(", ")}` },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = String(formData.get("folder") || "uploads");
    const type = String(formData.get("type") || "image");

    console.log("🔍 [UPLOAD] File:", {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      folder,
      uploadType: type,
    });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size
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

    // Validate type
    const allowed =
      type === "document" ? ALLOWED_DOC_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.includes(file.type as any)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // Upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = generateKey(folder, file.name);

    console.log("🔍 [UPLOAD] Uploading to R2:", { key });

    const result = await uploadFile(buffer, key, file.type);

    console.log("✅ [UPLOAD] Success:", result);

    return NextResponse.json({
      ok: true,
      key: result.key,
      url: result.url,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (e: any) {
    console.error("❌ [UPLOAD] Error:", {
      message: e.message,
      name: e.name,
      code: e.Code || e.code,
      statusCode: e.$metadata?.httpStatusCode,
      requestId: e.$metadata?.requestId,
    });

    return NextResponse.json(
      {
        error: e.message || "Upload failed",
        code: e.Code || e.code || "unknown",
        details: e.$metadata || null,
      },
      { status: 500 }
    );
  }
}
