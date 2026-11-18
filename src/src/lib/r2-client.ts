// src/lib/r2-client.ts
// ═══════════════════════════════════════════════════════════════
// ☁️ CLOUDFLARE R2 CLIENT — S3-compatible storage
// ═══════════════════════════════════════════════════════════════

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// ═══════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════
let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Missing R2 credentials");
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  return cachedClient;
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD
// ═══════════════════════════════════════════════════════════════
export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export async function uploadFile(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await client.send(command);

  return {
    key,
    url: `${R2_PUBLIC_URL}/${key}`,
    size: file.length,
    contentType,
  };
}

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (e) {
    console.error("R2 delete error:", e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export async function listFiles(prefix?: string): Promise<string[]> {
  try {
    const client = getR2Client();
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
    });
    const res = await client.send(command);
    return (res.Contents || []).map((c) => c.Key || "").filter(Boolean);
  } catch (e) {
    console.error("R2 list error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC URL
// ═══════════════════════════════════════════════════════════════
export function getPublicUrl(key: string): string {
  if (!key) return "";
  return `${R2_PUBLIC_URL}/${key}`;
}

// ═══════════════════════════════════════════════════════════════
// PRESIGNED URL (for temporary access)
// ═══════════════════════════════════════════════════════════════
export async function getPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

// ═══════════════════════════════════════════════════════════════
// KEY GENERATORS
// ═══════════════════════════════════════════════════════════════
export function generateKey(
  folder: string,
  originalName: string
): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeName = originalName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);
  return `${folder}/${timestamp}-${random}-${safeName}.${ext}`;
}

// ═══════════════════════════════════════════════════════════════
// ALLOWED TYPES
// ═══════════════════════════════════════════════════════════════
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOC_SIZE = 5 * 1024 * 1024;   // 5MB
