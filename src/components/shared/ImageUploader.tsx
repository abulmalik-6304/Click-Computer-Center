// src/components/shared/ImageUploader.tsx
"use client";

import { useState, useRef } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

type UploadAcceptType = "image" | "document" | "digital";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: UploadAcceptType;
  maxSizeMB?: number;
  disabled?: boolean;
}

function getDefaultMaxSizeMB(accept: UploadAcceptType): number {
  if (accept === "digital") return 1000;
  return 10;
}

function getInputAcceptAttr(accept: UploadAcceptType): string {
  if (accept === "image") return "image/*";
  if (accept === "document") return "image/*,.pdf";
  return ".pdf,.zip,.rar,.7z,.psd,.mp4,.mp3,application/pdf,application/zip,video/mp4,audio/mpeg";
}

function getHintText(accept: UploadAcceptType, maxSizeMB: number): string {
  if (accept === "image") return `JPG, PNG, WebP, GIF · Max ${maxSizeMB}MB`;
  if (accept === "document") return `PDF, JPG, PNG, WebP · Max ${maxSizeMB}MB`;
  return `ZIP, RAR, 7Z, PSD, PDF, MP4, MP3 · Max ${maxSizeMB}MB`;
}

function isLikelyImage(value: string, accept: UploadAcceptType): boolean {
  if (accept === "digital") return false;
  const clean = value.split("?")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return false;
  return true;
}

function uploadViaXhr(
  method: "POST" | "PUT",
  url: string,
  body: XMLHttpRequestBodyInit,
  headers: Record<string, string>,
  onProgress: (pct: number) => void
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    Object.entries(headers).forEach(([k, v]) => {
      xhr.setRequestHeader(k, v);
    });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      resolve({ status: xhr.status, text: xhr.responseText || "" });
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading"));
    });

    xhr.send(body);
  });
}

export default function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  label = "Upload File",
  accept = "image",
  maxSizeMB,
  disabled = false,
}: Props) {
  const effectiveMaxMB = maxSizeMB ?? getDefaultMaxSizeMB(accept);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const maxBytes = effectiveMaxMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File too large. Max ${effectiveMaxMB}MB allowed`);
        setUploading(false);
        return;
      }

      const useDirectR2 = accept === "digital" || file.size > 4 * 1024 * 1024;

      if (useDirectR2) {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
            folder,
            type: accept,
          }),
        });

        const presignData = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok || !presignData.uploadUrl) {
          setError(presignData.error || `Failed to prepare upload (${presignRes.status})`);
          setUploading(false);
          return;
        }

        const contentType = presignData.contentType || file.type || "application/octet-stream";
        const putResult = await uploadViaXhr(
          "PUT",
          presignData.uploadUrl,
          file,
          { "Content-Type": contentType },
          setProgress
        );

        if (putResult.status >= 200 && putResult.status < 300) {
          onChange(presignData.url || presignData.key);
        } else {
          setError(`Direct R2 upload failed (HTTP ${putResult.status})`);
        }
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("type", accept);

      const postResult = await uploadViaXhr("POST", "/api/upload", formData, {}, setProgress);
      let data: any = {};
      try {
        data = JSON.parse(postResult.text || "{}");
      } catch {
        data = {};
      }

      if (postResult.status >= 200 && postResult.status < 300 && data.ok && (data.url || data.key)) {
        onChange(data.url || data.key);
      } else {
        setError(data.error || `Upload failed (HTTP ${postResult.status})`);
      }
      setUploading(false);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const showImagePreview = isLikelyImage(value, accept);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {label}
      </label>

      {value ? (
        <div className="relative group rounded-lg border-2 border-slate-200 bg-slate-50 p-2">
          {showImagePreview ? (
            <img
              src={formatDriveUrl(value)}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md bg-slate-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          ) : (
            <div className="h-32 flex flex-col items-center justify-center gap-1 rounded-md bg-slate-100 px-4 text-center">
              <span className="text-3xl">📦</span>
              <p className="text-sm font-semibold text-slate-800">
                File attached
              </p>
              <p className="text-xs text-slate-500 break-all max-w-full">
                {value}
              </p>
            </div>
          )}

          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg opacity-90 group-hover:opacity-100 transition"
              title="Remove"
            >
              ✕
            </button>
          )}

          {showImagePreview && (
            <p className="text-xs text-slate-500 mt-2 truncate">{value}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || disabled}
          className="w-full h-48 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center gap-2 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-600">
                Uploading... {progress}%
              </p>
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <span className="text-4xl">📤</span>
              <p className="text-sm font-semibold text-slate-700">
                Click to upload
              </p>
              <p className="text-xs text-slate-500 text-center">
                {getHintText(accept, effectiveMaxMB)}
              </p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={getInputAcceptAttr(accept)}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">❌ {error}</p>
        </div>
      )}
    </div>
  );
}
