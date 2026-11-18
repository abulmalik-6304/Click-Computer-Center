// src/components/shared/ImageUploader.tsx
"use client";

import { useState, useRef } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: "image" | "document";
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  label = "Upload Image",
  accept = "image",
  maxSizeMB = 5,
  disabled = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      // Validate
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File too large. Max ${maxSizeMB}MB`);
        setUploading(false);
        return;
      }

      // Upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("type", accept);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.ok && data.url) {
            onChange(data.url);
          } else {
            setError(data.error || "Upload failed");
          }
        } else {
          setError("Upload failed");
        }
        setUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Upload failed");
        setUploading(false);
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (e: any) {
      setError(e.message);
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {label}
      </label>

      {/* Preview */}
      {value ? (
        <div className="relative group">
          <img
            src={formatDriveUrl(value)}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-slate-200 bg-slate-50"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = "/placeholder.svg")
            }
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg opacity-0 group-hover:opacity-100 transition"
              title="Remove"
            >
              ✕
            </button>
          )}
          <p className="text-xs text-slate-500 mt-1 truncate">{value}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || disabled}
          className="w-full h-48 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-xs text-slate-500">
                {accept === "image" ? "JPG, PNG, WebP, GIF" : "PDF, JPG, PNG"} · Max{" "}
                {maxSizeMB}MB
              </p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept === "image" ? "image/*" : "image/*,.pdf"}
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
