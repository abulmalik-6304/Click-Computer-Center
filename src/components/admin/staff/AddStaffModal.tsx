// src/components/admin/staff/AddStaffModal.tsx
"use client";

import { useState } from "react";
import PasswordInput from "@/components/admin/PasswordInput";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

export default function AddStaffModal({
  callerRole,
  onClose,
  onSuccess,
}: {
  callerRole: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isOwner = callerRole === "owner";

  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    role: "staff",
    jobRole: "",
    profilePicture: "",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: form.userName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          jobRole: form.jobRole,
          profilePicture: form.profilePicture,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">➕ Add New Staff</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <Field
          label="Full Name *"
          value={form.userName}
          onChange={(v) => setForm({ ...form, userName: v })}
          required
        />
        <Field
          label="Email *"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
          placeholder="user@example.com"
        />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="+251 9XX XXX XXX"
        />
        <Field
          label="Job Role"
          value={form.jobRole}
          onChange={(v) => setForm({ ...form, jobRole: v })}
          placeholder="e.g. Cashier, Technician"
        />

        {isOwner ? (
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            >
              <option value="staff">Staff</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            >
              <option value="staff">Staff</option>
              <option value="employee">Employee</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              ℹ️ Managers can only add staff/employee
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Profile Picture (Google Drive URL)
          </label>
          <input
            type="text"
            value={form.profilePicture}
            onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
          {form.profilePicture && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={formatDriveUrl(form.profilePicture)}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500 bg-slate-100"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/placeholder.svg")
                }
              />
              <span className="text-xs text-emerald-600">✅ Preview</span>
            </div>
          )}
        </div>

        <PasswordInput
          label="Password *"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          required
          showStrength
        />
        <PasswordInput
          label="Confirm Password *"
          value={form.confirmPassword}
          onChange={(v) => setForm({ ...form, confirmPassword: v })}
          required
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Staff"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
      />
    </div>
  );
}
