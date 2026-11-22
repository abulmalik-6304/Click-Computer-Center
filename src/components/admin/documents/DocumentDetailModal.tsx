// src/components/admin/documents/DocumentDetailModal.tsx
"use client";

import { useState, useEffect } from "react";
import { DocumentRecord, formatFileSize } from "@/lib/document-types";
import { getCategoryLabel, getCategoryIcon } from "@/lib/document-categories";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Props {
  document: DocumentRecord;
  onClose: () => void;
  onUpdated: () => void;
}

export default function DocumentDetailModal({
  document,
  onClose,
  onUpdated,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleDelete() {
    if (!confirm(`Archive "${document.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: document.id, deleteFile: false }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed");
      }
      onUpdated();
    } catch (e: any) {
      alert(e?.message || "Failed to archive document");
    } finally {
      setDeleting(false);
    }
  }

  function printDocument() {
    if (document.fileType !== "image") {
      window.open(document.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.open(document.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title></title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              @page { size: A4; margin: 10mm; }
            }
          </style>
        </head>
        <body></body>
      </html>
    `);
    doc.close();

    doc.title = document.title;
    const img = doc.createElement("img");
    img.src = formatDriveUrl(document.fileUrl);
    img.alt = document.title;
    img.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 400);
    };
    doc.body.appendChild(img);
  }

  const previewUrl = formatDriveUrl(document.fileUrl);
  const isPdf =
    document.fileType === "pdf" ||
    document.fileUrl?.toLowerCase().split("?")[0].endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-3 z-10">
          <h2 className="text-lg font-bold text-slate-900 truncate">
            {document.title}
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={printDocument}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
              title="Print"
            >
              🖨
            </button>
            <a
              href={document.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              title="Download"
            >
              ⬇️
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* File Preview */}
          <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            {document.fileType === "image" ? (
              <img
                src={previewUrl}
                alt={document.title}
                className="w-full max-h-[500px] object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            ) : isPdf ? (
              <iframe
                src={document.fileUrl}
                className="w-full h-[500px]"
                title={document.title}
              />
            ) : (
              <div className="h-52 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="text-4xl">📄</span>
                <p className="text-sm font-semibold text-slate-800">
                  {document.title}
                </p>
                <p className="text-xs text-slate-500">
                  {document.fileType?.toUpperCase() || "FILE"} ·{" "}
                  {formatFileSize(document.fileSize)}
                </p>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 px-4 py-1.5 text-xs bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Open File in New Tab
                </a>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <InfoRow
              label="Category"
              value={`${getCategoryIcon(document.category)} ${getCategoryLabel(
                document.category
              )}`}
            />
            <InfoRow
              label="File Type & Size"
              value={`${document.fileType?.toUpperCase() || "FILE"} · ${formatFileSize(
                document.fileSize
              )}`}
            />
            <InfoRow
              label="Issue Date"
              value={document.issueDate || "—"}
            />
            <InfoRow
              label="Expiry Date"
              value={document.expiryDate || "—"}
            />
            <InfoRow
              label="Uploaded By"
              value={document.uploadedBy || "—"}
            />
            <InfoRow
              label="Uploaded At"
              value={
                document.uploadedAt
                  ? new Date(document.uploadedAt).toLocaleString()
                  : "—"
              }
            />
          </div>

          {document.description && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-900">{document.description}</p>
            </div>
          )}

          {document.tags && (
            <div className="flex flex-wrap gap-1.5">
              {document.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 transition"
            >
              {deleting ? "Archiving…" : "🗑 Archive Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 break-words">{value}</p>
    </div>
  );
}
