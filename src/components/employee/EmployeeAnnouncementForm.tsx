// src/components/employee/EmployeeAnnouncementForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeAnnouncementForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("❌ Title is required");
      return;
    }
    if (!message.trim()) {
      setError("❌ Message is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          image,
          targetRole,
          priority,
          status: "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "❌ Failed to create announcement");
        setSaving(false);
        return;
      }

      setSuccess(`✅ Announcement created! (${data.id || ""})`);

      setTimeout(() => {
        router.push("/employee/announcements");
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
    >
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          📝 Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Holiday Closure Notice"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          💬 Message *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Write your announcement…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          🖼 Image URL (optional)
        </label>
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Target + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            🎯 Target
          </label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="all">Everyone</option>
            <option value="employee">Employees only</option>
            <option value="staff">Staff only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            ⚡ Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="normal">🟢 Normal</option>
            <option value="high">🔴 High</option>
            <option value="urgent">🚨 Urgent</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm disabled:opacity-50"
      >
        {saving ? "⏳ Publishing…" : "✉️ Publish Announcement"}
      </button>
    </form>
  );
}
