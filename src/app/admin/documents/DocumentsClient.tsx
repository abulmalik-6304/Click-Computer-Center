// src/app/admin/documents/DocumentsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { DocumentRecord } from "@/lib/document-types";
import {
  DOCUMENT_CATEGORIES,
  getCategoryLabel,
} from "@/lib/document-categories";
import DocumentCard from "@/components/admin/documents/DocumentCard";
import DocumentUploadForm from "@/components/admin/documents/DocumentUploadForm";
import DocumentDetailModal from "@/components/admin/documents/DocumentDetailModal";

interface Props {
  initialDocuments: DocumentRecord[];
  userRole: string;
  userEmail: string;
}

export default function DocumentsClient({
  initialDocuments,
  userRole,
}: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [detail, setDetail] = useState<DocumentRecord | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.documents)) setDocuments(data.documents);
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchQ =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.toLowerCase().includes(q);
      const matchCat =
        categoryFilter === "all" || d.category === categoryFilter;
      return matchQ && matchCat;
    });
  }, [documents, search, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      expired: documents.filter((d) => {
        if (!d.expiryDate) return false;
        return new Date(d.expiryDate) < new Date();
      }).length,
      expiringSoon: documents.filter((d) => {
        if (!d.expiryDate) return false;
        const exp = new Date(d.expiryDate);
        const diff = exp.getTime() - Date.now();
        return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [documents]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            📁 Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} documents · {stats.expiringSoon} expiring soon ·{" "}
            {stats.expired} expired
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm text-sm"
        >
          + Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="Expiring" value={stats.expiringSoon} color="orange" />
        <StatCard label="Expired" value={stats.expired} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by title, description, tags…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              categoryFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            All
          </button>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                categoryFilter === cat.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-slate-500">No documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={() => setDetail(doc)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <DocumentUploadForm
          onClose={() => setShowUpload(false)}
          onSaved={() => {
            setShowUpload(false);
            refresh();
          }}
        />
      )}
      {detail && (
        <DocumentDetailModal
          document={detail}
          onClose={() => setDetail(null)}
          onUpdated={() => {
            setDetail(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const cls =
    {
      slate: "bg-slate-50 border-slate-200 text-slate-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      red: "bg-red-50 border-red-200 text-red-700",
    }[color] ?? "bg-slate-50 border-slate-200 text-slate-700";
  return (
    <div className={`${cls} p-3 rounded-xl border text-center`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
