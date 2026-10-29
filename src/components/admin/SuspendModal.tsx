// src/components/admin/SuspendModal.tsx
"use client";

import { useState } from "react";

interface Props {
  targetEmail: string;
  targetName: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SuspendModal({
  targetEmail, targetName, currentStatus, onClose, onSuccess,
}: Props) {
  const isSuspended = String(currentStatus).toLowerCase() === "suspended";
  const action = isSuspended ? "activate" : "suspend";

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/staff/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      setSuccess(true);
      onSuccess?.();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center space-y-3">
          <div className="text-5xl">{isSuspended ? "✅" : "🚫"}</div>
          <h2 className="text-xl font-bold text-slate-900">
            {isSuspended ? "Account Activated!" : "Account Suspended"}
          </h2>
          <p className="text-sm text-slate-500">
            {isSuspended
              ? `${targetName} can now log in again.`
              : `${targetName} has been blocked from logging in.`}
          </p>
          <button
            onClick={onClose}
            className="mt-3 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {isSuspended ? "✅ Activate Account" : "🚫 Suspend Account"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>

        <div className={`p-3 rounded-lg border ${isSuspended ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-sm ${isSuspended ? "text-emerald-900" : "text-red-900"}`}>
            <strong>{targetName}</strong> ({targetEmail})
          </p>
          {!isSuspended && (
            <p className="text-xs text-red-700 mt-1">
              ⚠️ This staff will be immediately blocked from logging in.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            {isSuspended ? "Note (optional)" : "Reason for suspension *"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isSuspended ? "Why are you reactivating?" : "e.g. Repeated lateness, policy violation…"}
            required={!isSuspended}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            rows={3}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || (!isSuspended && !reason.trim())}
            className={`flex-1 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50 ${
              isSuspended
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading
              ? "Processing…"
              : isSuspended
              ? "Activate"
              : "Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}
