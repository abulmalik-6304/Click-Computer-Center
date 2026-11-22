// src/components/admin/digital-products/DigitalProductForm.tsx
"use client";

import { useState } from "react";
import ImageUploader from "@/components/shared/ImageUploader";
import { DIGITAL_CATEGORIES } from "@/lib/digital-product-types";

interface Props {
  product?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function DigitalProductForm({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(Number(product?.price) || 0);
  const [category, setCategory] = useState(product?.category || "ebook");
  const [thumbnailImage, setThumbnailImage] = useState(product?.thumbnailImage || "");
  const [fileUrl, setFileUrl] = useState(product?.fileUrl || "");
  const [fileKey, setFileKey] = useState(product?.fileKey || "");
  const [fileSize, setFileSize] = useState(Number(product?.fileSize) || 0);
  const [fileType, setFileType] = useState(product?.fileType || "");
  const [downloadLimit, setDownloadLimit] = useState(Number(product?.downloadLimit) || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required"); return; }
    if (isEdit ? false : !fileUrl) { setError("File is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/digital-products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: product.id } : {}),
          title, description, price, category,
          thumbnailImage, fileUrl, fileKey, fileSize, fileType,
          downloadLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {isEdit ? "✏️ Edit Digital Product" : "📤 Upload Digital Product"}
            </h2>
            <p className="text-xs text-emerald-100">
              {isEdit ? "Update product details" : "Sell E-books, Templates, Software"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-emerald-100 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Web Development Guide 2024" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's included?" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Price (ETB) *</label>
              <input type="number" min={0} step={0.01} value={price || ""} onChange={(e) => setPrice(Number(e.target.value) || 0)} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                {DIGITAL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Thumbnail Image */}
          <ImageUploader
            value={thumbnailImage}
            onChange={setThumbnailImage}
            folder="digital-products/thumbnails"
            label="🖼 Thumbnail Image"
            accept="image"
            maxSizeMB={5}
          />

          {/* File Upload (Digital ZIP / Archive / PDF / Media) */}
          {!isEdit && (
            <ImageUploader
              value={fileUrl}
              onChange={(url) => {
                setFileUrl(url);
                if (url) {
                  const cleanUrl = url.split("?")[0].toLowerCase();
                  const ext = cleanUrl.split(".").pop() || "zip";
                  const parts = url.split("/");
                  setFileKey(parts.slice(-2).join("/"));
                  setFileType(ext);
                } else {
                  setFileKey("");
                  setFileType("");
                  setFileSize(0);
                }
              }}
              folder="digital-products/files"
              label="📎 Digital File (ZIP, RAR, 7Z, PDF, MP4, MP3) *"
              accept="digital"
              maxSizeMB={1000}
            />
          )}

          {/* Download Limit */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Download Limit</label>
            <input type="number" min={0} value={downloadLimit} onChange={(e) => setDownloadLimit(Number(e.target.value) || 0)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <p className="text-xs text-slate-500 mt-1">0 = unlimited downloads</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">Cancel</button>
          <button type="submit" disabled={saving || (!fileUrl && !isEdit)} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Update" : "Upload Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
