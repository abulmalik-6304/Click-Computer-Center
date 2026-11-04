// src/components/admin/ProfilePhotoModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

export default function ProfilePhotoModal({
  currentName,
  currentPhoto,
  currentPhone,
  onClose,
}: {
  currentName: string;
  currentPhoto: string;
  currentPhone: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [photo, setPhoto] = useState(currentPhoto);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilePicture: photo,
          userName: name,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setSuccess("✅ Profile updated!");
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">👤 Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Photo preview */}
        <div className="flex flex-col items-center">
          <img
            src={formatDriveUrl(photo)}
            alt="Preview"
            className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500 bg-slate-100"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = "/placeholder.svg")
            }
          />
          <p className="text-xs text-slate-500 mt-2">Current Photo</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Profile Picture URL
          </label>
          <input
            type="text"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            ⓘ Paste a Google Drive link or image URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700">{success}</p>
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
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
