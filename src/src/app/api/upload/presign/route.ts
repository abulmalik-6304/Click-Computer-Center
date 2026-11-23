// src/app/api/upload/presign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  generateKey,
  getPublicUrl,
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

function getRules(uploadType: UploadKind) {
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

  const accountId = (process.env.R2_ACCOUNT_ID || "").trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  const bucketName = (process.env.R2_BUCKET_NAME || "").trim();
  const rawEndpoint = (process.env.R2_ENDPOINT || "").trim();

  const endpoint = (
    rawEndpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  ).replace(/\/+$/, "");

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    return NextResponse.json(
      { error: "Missing R2 credentials, bucket name, or endpoint" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const fileName = String(body.fileName || "file.bin");
    const fileType = String(body.fileType || "application/octet-stream");
    const fileSize = Number(body.fileSize || 0);
    const folder = String(body.folder || "uploads");
    const rawType = String(body.type || "image");
    const uploadType: UploadKind =
      rawType === "document" || rawType === "digital" ? rawType : "image";

    const { maxSize, allowed } = getRules(uploadType);

    if (fileSize > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: `File too large. Max ${maxMB}MB allowed` },
        { status: 400 }
      );
    }

    const isZipByName = fileName.toLowerCase().endsWith(".zip");
    const typeAllowed =
      !fileType ||
      allowed.includes(fileType) ||
      (uploadType === "digital" && isZipByName);

    if (!typeAllowed) {
      return NextResponse.json(
        { error: `File type ${fileType} not allowed for ${uploadType}` },
        { status: 400 }
      );
    }

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const key = generateKey(folder, fileName).replace(/^\/+/, "");
    const contentType = fileType || "application/octet-stream";

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      ok: true,
      uploadUrl,
      key,
      url: publicUrl,
      contentType,
    });
  } catch (e: any) {
    console.error("❌ [PRESIGN] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to create upload link" },
      { status: 500 }
    );
  }
}
