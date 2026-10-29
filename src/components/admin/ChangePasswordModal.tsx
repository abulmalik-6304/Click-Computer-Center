// src/components/admin/ChangePasswordModal.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import PasswordInput from "./PasswordInput";

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
          confirmPassword: confirm,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(async () => {
        // Force re-login for security
        await signOut({ callbackUrl: "/login" });
      }, 2000);
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
          <h2 className="text-xl font-bold text-slate-900">Password Changed!</h2>
          <p className="text-sm text-slate-500">
            Redirecting to login for security…
          </p>
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
          <h2 className="text-xl font-bold text-slate-900">🔐 Change Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <PasswordInput
          label="Current Password"
          value={current}
          onChange={setCurrent}
          required
          autoComplete="current-password"
        />
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

        <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <p className="font-semibold mb-1">Password must contain:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li className={next.length >= 8 ? "text-emerald-600" : ""}>
              At least 8 characters
            </li>
            <li className={/[a-z]/.test(next) ? "text-emerald-600" : ""}>
              Lowercase letter
            </li>
            <li className={/[A-Z]/.test(next) ? "text-emerald-600" : ""}>
              Uppercase letter (recommended)
            </li>
            <li className={/[0-9]/.test(next) ? "text-emerald-600" : ""}>
              Number (recommended)
            </li>
          </ul>
        </div>

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
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Changing…" : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
