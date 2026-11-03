// src/components/admin/sales/VoidSaleModal.tsx
"use client";

import { useState } from "react";

type Action = "void" | "refund" | "delete";

interface Props {
  salesId: string;
  invoiceNo: string;
  totalAmount: number;
  saleStatus: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VoidSaleModal({
  salesId,
  invoiceNo,
  totalAmount,
  saleStatus,
  onClose,
  onSuccess,
}: Props) {
  const [action, setAction] = useState<Action>("void");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDelete = saleStatus === "Draft";

  async function submit() {
    setError("");
    if (!reason.trim()) {
      setError("እባክዎ ምክንያት ይጻፉ (Reason is required)");
      return;
    }
    if (!confirm) {
      setError("እባክዎ ማረጋገጫ ይስጡ (Confirm required)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sales/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  const actionLabels: Record<Action, { label: string; emoji: string; color: string }> = {
    void: {
      label: "Void Sale",
      emoji: "🚫",
      color: "bg-red-600 hover:bg-red-700",
    },
    refund: {
      label: "Refund",
      emoji: "💵",
      color: "bg-orange-600 hover:bg-orange-700",
    },
    delete: {
      label: "Delete Sale",
      emoji: "🗑",
      color: "bg-slate-900 hover:bg-slate-800",
    },
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">⚠️ Void / Refund</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Sale info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice:</span>
            <strong className="text-slate-900">{invoiceNo}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount:</span>
            <strong className="text-emerald-600">
              {totalAmount.toLocaleString()} ETB
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Current Status:</span>
            <strong className="text-slate-900">{saleStatus}</strong>
          </div>
        </div>

        {/* Action selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            What do you want to do?
          </label>
          <div className="space-y-2">
            {/* Void */}
            <button
              onClick={() => setAction("void")}
              className={`w-full text-left p-3 rounded-lg border-2 transition ${
                action === "void"
                  ? "border-red-500 bg-red-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🚫</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Void Sale</p>
                  <p className="text-xs text-slate-600">
                    ሽያጩ ስህተት ነበር — Stock ይመለሳል + ሽያጩ ከሪፖርት ይወገዳል
                  </p>
                </div>
              </div>
            </button>

            {/* Refund */}
            <button
              onClick={() => setAction("refund")}
              className={`w-full text-left p-3 rounded-lg border-2 transition ${
                action === "refund"
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Refund</p>
                  <p className="text-xs text-slate-600">
                    ደንበኛ እቃውን መለሰ — Stock ይመለሳል + ገንዘቡ ተመላሽ
                  </p>
                </div>
              </div>
            </button>

            {/* Delete (Draft only) */}
            {canDelete && (
              <button
                onClick={() => setAction("delete")}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  action === "delete"
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗑</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Delete Draft</p>
                    <p className="text-xs text-slate-600">
                      Draft ብቻ — ሙሉ ሰርዝ (Stock አይመለስም — Draft ስለሆነ)
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ለምን ይሰረዛል? / ለምን ይመለሳል?"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        {/* Confirm */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="w-4 h-4 accent-red-600"
          />
          <span className="text-sm text-slate-700">
            እርግጠኛ ነኝ — ይህ ተግባር መመለስ አይችልም
          </span>
        </label>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !confirm || !reason.trim()}
            className={`flex-1 py-2.5 rounded-lg text-white font-bold disabled:opacity-50 ${
              actionLabels[action].color
            }`}
          >
            {loading
              ? "Processing…"
              : `${actionLabels[action].emoji} ${actionLabels[action].label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
