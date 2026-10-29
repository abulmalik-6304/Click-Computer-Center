// src/components/admin/ResetPasswordModal.tsx
"use client";

import { useState } from "react";
import PasswordInput from "./PasswordInput";

interface Props {
  targetEmail: string;
  targetName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResetPasswordModal({
  targetEmail,
  targetName,
  onClose,
  onSuccess,
}: Props) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, newPassword: next }),
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
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-slate-900">Password Reset!</h2>
          <p className="text-sm text-slate-500">
            Share the new password with <strong>{targetName}</strong> securely.
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
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">🔄 Reset Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-900">
            Resetting password for:
            <br />
            <strong>{targetName}</strong> ({targetEmail})
          </p>
        </div>

        <PasswordInput
          label="New Password"
          value={next}
          onChange={setNext}
          required
          showStrength
        />
        <PasswordInput
          label="Confirm New Password"
          value={confirm}
          onChange={setConfirm}
          required
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
