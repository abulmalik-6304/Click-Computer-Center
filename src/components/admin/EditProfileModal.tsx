// src/components/admin/EditProfileModal.tsx
"use client";

import { useState } from "react";

interface Props {
  targetEmail: string;
  targetRole: string;
  initialData: {
    userName: string;
    phone: string;
    role: string;
    profilePicture: string;
    status: string;
  };
  callerRole: string;  // owner | manager | staff
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditProfileModal({
  targetEmail, targetRole, initialData, callerRole, onClose, onSuccess,
}: Props) {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canChangeRole = callerRole.toLowerCase() === "owner";
  const isSelf = false; // backend enforces

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail,
          updates: {
            userName: form.userName,
            phone: form.phone,
            role: form.role,
            profilePicture: form.profilePicture,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
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
          <h2 className="text-xl font-bold text-slate-900">Profile Updated</h2>
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">✏️ Edit Profile</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
            Editing: <strong>{targetEmail}</strong>
          </p>
        </div>

        <Field label="Full Name" value={form.userName} onChange={(v) => setForm({ ...form, userName: v })} required />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Profile Picture URL" value={form.profilePicture} onChange={(v) => setForm({ ...form, profilePicture: v })} placeholder="https://drive.google.com/file/d/..." />

        {canChangeRole && (
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              ⚠️ Only owners can change roles
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}
