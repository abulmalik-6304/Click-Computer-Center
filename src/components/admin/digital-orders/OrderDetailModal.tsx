// src/components/admin/digital-orders/OrderDetailModal.tsx
"use client";

import { useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Props {
  order: any;
  userRole: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function OrderDetailModal({
  order,
  userRole,
  onClose,
  onUpdated,
}: Props) {
  const [notes, setNotes] = useState(order.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} order?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/digital-orders/${order.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  const downloadUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/download/${order.downloadToken}`
      : `/download/${order.downloadToken}`;

  async function copyDownloadLink() {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      alert("✅ Download link copied!");
    } catch {
      prompt("Copy this link:", downloadUrl);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Order {order.id}
            </h2>
            <p className="text-xs text-slate-500">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status banner */}
          <div
            className={`p-3 rounded-lg border ${
              order.status === "approved"
                ? "bg-emerald-50 border-emerald-200"
                : order.status === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <p className="text-sm font-bold capitalize">
              {order.status === "approved"
                ? "✅ Approved"
                : order.status === "rejected"
                ? "❌ Rejected"
                : "⏳ Pending Approval"}
            </p>
            {order.approvedAt && (
              <p className="text-xs text-slate-600 mt-1">
                {new Date(order.approvedAt).toLocaleString()} ·{" "}
                {order.approvedBy}
              </p>
            )}
          </div>

          {/* Product */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Product</p>
            <p className="font-semibold text-slate-900">
              {order.productTitle}
            </p>
            <p className="text-sm text-emerald-600 font-bold">
              {order.price.toLocaleString()} ETB
            </p>
          </div>

          {/* Customer */}
          <div className="p-3 bg-slate-50 rounded-lg grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="font-medium">{order.customerPhone}</p>
            </div>
            {order.customerEmail && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium break-all">{order.customerEmail}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">
              Payment Method: <strong>{order.paymentMethod}</strong>
            </p>
            <p className="text-xs text-slate-500 mb-2">
              Amount: <strong>{order.paymentAmount.toLocaleString()} ETB</strong>
            </p>
            {order.paymentReference && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Screenshot:</p>
                <a
                  href={order.paymentReference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={formatDriveUrl(order.paymentReference)}
                    alt="Payment"
                    className="w-full max-h-64 object-contain rounded border border-slate-300 bg-white"
                  />
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Notes (admin)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes for this order…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Download link (only if approved) */}
          {order.status === "approved" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-2">
                🔗 Download Link
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={downloadUrl}
                  readOnly
                  className="flex-1 rounded border border-blue-300 bg-white px-2 py-1.5 text-xs font-mono"
                />
                <button
                  onClick={copyDownloadLink}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                >
                  📋 Copy
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Download count: {order.downloadCount} /{" "}
                {order.downloadLimit || "unlimited"}
              </p>
            </div>
          )}

          {/* Actions */}
          {order.status === "pending" && (
            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => handleAction("reject")}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                ❌ Reject
              </button>
              <button
                onClick={() => handleAction("approve")}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
              >
                ✅ Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
