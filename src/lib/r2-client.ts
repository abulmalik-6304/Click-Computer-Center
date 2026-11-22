// src/lib/r2-client.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getConfig() {
  const accountId = (process.env.R2_ACCOUNT_ID || "").trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  const bucketName = (process.env.R2_BUCKET_NAME || "").trim();
  const rawEndpoint = (process.env.R2_ENDPOINT || "").trim();
  const rawPublicUrl = (process.env.R2_PUBLIC_URL || "").trim();

  const endpoint = (
    rawEndpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  ).replace(/\/+$/, "");

  const publicUrl = rawPublicUrl.replace(/\/+$/, "");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    publicUrl,
  };
}

function createR2Client(): S3Client {
  const { accessKeyId, secretAccessKey, endpoint, bucketName } = getConfig();

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error("Missing R2 credentials, bucket name, or endpoint");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

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
  const { bucketName, publicUrl } = getConfig();
  const client = createR2Client();

  const cleanKey = key.replace(/^\/+/, "");

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: file,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await client.send(command);

  return {
    key: cleanKey,
    url: publicUrl ? `${publicUrl}/${cleanKey}` : cleanKey,
    size: file.length,
    contentType,
  };
}

export async function deleteFile(key: string): Promise<boolean> {
  try {
    const { bucketName } = getConfig();
    const client = createR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key.replace(/^\/+/, ""),
    });
    await client.send(command);
    return true;
  } catch (e) {
    console.error("R2 delete error:", e);
    return false;
  }
}

export async function listFiles(prefix?: string): Promise<string[]> {
  try {
    const { bucketName } = getConfig();
    const client = createR2Client();
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
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

export function getPublicUrl(key: string): string {
  if (!key) return "";
  if (/^https?:\/\//i.test(key)) return key;
  const { publicUrl } = getConfig();
  const cleanKey = key.replace(/^\/+/, "");
  return publicUrl ? `${publicUrl}/${cleanKey}` : cleanKey;
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const { bucketName } = getConfig();
  const client = createR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key.replace(/^\/+/, ""),
  });
  return getSignedUrl(client, command, { expiresIn });
}

export function generateKey(folder: string, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeName = originalName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40) || "file";
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "") || "uploads";
  return `${cleanFolder}/${timestamp}-${random}-${safeName}.${ext}`;
}

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

export const ALLOWED_DIGITAL_PRODUCT_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "application/octet-stream",
] as const;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DIGITAL_PRODUCT_SIZE = 500 * 1024 * 1024; // 500MB
