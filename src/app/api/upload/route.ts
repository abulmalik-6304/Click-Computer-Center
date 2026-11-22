// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  uploadFile,
  generateKey,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALLOWED_DIGITAL_PRODUCT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOC_SIZE,
  MAX_DIGITAL_PRODUCT_SIZE,
} from "@/lib/r2-client";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadKind = "image" | "document" | "digital";

function getRules(uploadType: string) {
  if (uploadType === "document") {
    return {
      maxSize: MAX_DOC_SIZE,
      allowed: ALLOWED_DOC_TYPES as readonly string[],
    };
  }
  if (uploadType === "digital") {
    return {
      maxSize: MAX_DIGITAL_PRODUCT_SIZE,
      allowed: ALLOWED_DIGITAL_PRODUCT_TYPES as readonly string[],
    };
  }
  return {
    maxSize: MAX_IMAGE_SIZE,
    allowed: ALLOWED_IMAGE_TYPES as readonly string[],
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const missingVars: string[] = [];
  if (!process.env.R2_ACCOUNT_ID) missingVars.push("R2_ACCOUNT_ID");
  if (!process.env.R2_ACCESS_KEY_ID) missingVars.push("R2_ACCESS_KEY_ID");
  if (!process.env.R2_SECRET_ACCESS_KEY) missingVars.push("R2_SECRET_ACCESS_KEY");
  if (!process.env.R2_BUCKET_NAME) missingVars.push("R2_BUCKET_NAME");
  if (!process.env.R2_ENDPOINT) missingVars.push("R2_ENDPOINT");

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
    const rawType = String(formData.get("type") || "image");
    const uploadType: UploadKind =
      rawType === "document" || rawType === "digital" ? rawType : "image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { maxSize, allowed } = getRules(uploadType);

    if (file.size > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: `File too large. Max ${maxMB}MB allowed` },
        { status: 400 }
      );
    }

    if (file.type && !allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed for ${uploadType}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = generateKey(folder, file.name);
    const contentType = file.type || "application/octet-stream";

    const result = await uploadFile(buffer, key, contentType);

    return NextResponse.json({
      ok: true,
      key: result.key,
      url: result.url,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (e: any) {
    console.error("❌ [UPLOAD] Error:", {
      message: e?.message,
      name: e?.name,
      code: e?.Code || e?.code,
      statusCode: e?.$metadata?.httpStatusCode,
      requestId: e?.$metadata?.requestId,
    });

    return NextResponse.json(
      {
        error: e?.message || "Upload failed",
        code: e?.Code || e?.code || "unknown",
        details: e?.$metadata || null,
      },
      { status: 500 }
    );
  }
}
