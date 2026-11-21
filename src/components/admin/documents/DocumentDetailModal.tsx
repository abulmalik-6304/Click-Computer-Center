// src/components/admin/documents/DocumentDetailModal.tsx
"use client";

import { useState } from "react";
import { DocumentRecord, formatFileSize } from "@/lib/document-types";
import { getCategoryLabel, getCategoryIcon } from "@/lib/document-categories";

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

  async function handleDelete() {
    if (!confirm(`Archive "${document.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: document.id, deleteFile: false }),
      });
      if (!res.ok) throw new Error("Delete failed");
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  function printDocument() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    if (document.fileType === "image") {
      printWindow.document.write(`
        <html>
          <head><title>${document.title}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              @media print { @page { size: A4; margin: 10mm; } }
            </style>
          </head>
          <body><img src="${document.fileUrl}" onload="setTimeout(() => window.print(), 500)" /></body>
        </html>
      `);
    } else {
      // PDF — open in new tab
      window.open(document.fileUrl, "_blank");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900 truncate">
            {document.title}
          </h2>
          <div className="flex gap-1">
            <button
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
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              title="Download"
            >
              ⬇️
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="bg-slate-100 rounded-xl overflow-hidden">
            {document.fileType === "image" ? (
              <img
                src={document.fileUrl}
                alt={document.title}
                className="w-full max-h-[500px] object-contain"
              />
            ) : (
              <iframe
                src={document.fileUrl}
                className="w-full h-[500px]"
                title={document.title}
              />
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow
              label="Category"
              value={`${getCategoryIcon(document.category)} ${getCategoryLabel(
                document.category
              )}`}
            />
            <InfoRow
              label="File Size"
              value={formatFileSize(document.fileSize)}
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
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-900">{document.description}</p>
            </div>
          )}

          {document.tags && (
            <div className="flex flex-wrap gap-1">
              {document.tags.split(",").map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                >
                  #{t.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
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
