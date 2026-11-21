// src/components/admin/documents/DocumentCard.tsx
"use client";

import { DocumentRecord, isExpired, isExpiringSoon } from "@/lib/document-types";
import { getCategoryIcon, getCategoryLabel, getCategoryColor } from "@/lib/document-categories";

interface Props {
  document: DocumentRecord;
  onClick: () => void;
}

export default function DocumentCard({ document, onClick }: Props) {
  const expired = isExpired(document.expiryDate);
  const expiringSoon = isExpiringSoon(document.expiryDate);

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-orange-300 transition text-left flex flex-col"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-slate-100 flex items-center justify-center relative overflow-hidden">
        {document.fileType === "pdf" ? (
          <div className="text-6xl">📄</div>
        ) : (
          <img
            src={document.fileUrl}
            alt={document.title}
            className="w-full h-full object-cover"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = "/placeholder.svg")
            }
          />
        )}

        {/* Badge */}
        {expired && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
            Expired
          </span>
        )}
        {!expired && expiringSoon && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
            Expiring
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">
            {document.title}
          </h3>
        </div>

        <span
          className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
            document.category
          )}`}
        >
          {getCategoryIcon(document.category)}{" "}
          {getCategoryLabel(document.category)}
        </span>

        {document.description && (
          <p className="mt-2 text-xs text-slate-600 line-clamp-2">
            {document.description}
          </p>
        )}

        <p className="mt-auto pt-2 text-xs text-slate-400">
          {document.uploadedAt &&
            new Date(document.uploadedAt).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}
