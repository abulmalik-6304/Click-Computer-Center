// src/app/admin/announcements/AnnouncementsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { Announcement } from "./page";

type ModalMode = "create" | "edit" | null;

const TARGET_LABELS: Record<string, string> = {
  all: "🌍 Everyone",
  owner: "👑 Owners",
  manager: "📊 Managers",
  staff: "👥 Staff",
};

export default function AnnouncementsClient({
  initialAnnouncements,
  userRole,
}: {
  initialAnnouncements: Announcement[];
  userRole: string;
}) {
  const [items, setItems] = useState(initialAnnouncements);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<Announcement | null>(null);

  const canManage = ["owner", "manager"].includes(userRole);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (a) =>
          a.title.toLowerCase().includes(lq) ||
          a.message.toLowerCase().includes(lq)
      );
    }
    if (statusFilter !== "all") {
      out = out.filter((a) => a.status === statusFilter);
    }
    return out;
  }, [items, q, statusFilter]);

  const stats = {
    total: items.length,
    active: items.filter((a) => a.status === "active").length,
    archived: items.filter((a) => a.status === "archived").length,
    thisWeek: items.filter((a) => {
      const d = new Date(a.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length,
  };

  async function refresh() {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (Array.isArray(data.announcements)) setItems(data.announcements);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📢 Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} total · {stats.active} active · {stats.thisWeek} this week
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setActive(null); setModal("create"); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition"
          >
            + New Announcement
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="Active" value={stats.active} color="emerald" />
        <StatCard label="This Week" value={stats.thisWeek} color="orange" />
        <StatCard label="Archived" value={stats.archived} color="slate" />
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search title or message…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-slate-500 self-center">Status:</span>
          {(["all", "active", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                statusFilter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">No announcements yet</p>
          {canManage && (
            <button
              onClick={() => { setActive(null); setModal("create"); }}
              className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm"
            >
              Create the first one
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              {a.image && (
                <img
                  src={formatDriveUrl(a.image)}
                  alt={a.title}
                  className="w-full h-40 object-cover bg-slate-100"
                  onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")}
                />
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-slate-900 flex-1">{a.title}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      a.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : a.status === "archived"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">
                  {a.message}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {TARGET_LABELS[a.targetRole] || a.targetRole}
                  </span>
                </div>
                {canManage && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => { setActive(a); setModal("edit"); }}
                      className="flex-1 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Archive "${a.title}"?`)) return;
                        await fetch("/api/announcements", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: a.id }),
                        });
                        refresh();
                      }}
                      className="flex-1 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg"
                    >
                      🗑 Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <AnnouncementForm
          title="Create Announcement"
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal === "edit" && active && (
        <AnnouncementForm
          title="Edit Announcement"
          existing={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Form Modal ───

function AnnouncementForm({
  title, existing, onClose, onSaved,
}: { title: string; existing?: Announcement; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    message: existing?.message ?? "",
    image: existing?.image ?? "",
    targetRole: existing?.targetRole ?? "all",
    status: existing?.status ?? "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const method = existing ? "PUT" : "POST";
      const body = existing
        ? { id: existing.id, ...form }
        : form;
      const res = await fetch("/api/announcements", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="e.g. Holiday Closure Notice"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Message *</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            rows={4}
            placeholder="Write your announcement…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Image URL (optional)</label>
          <input
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Target</label>
            <select
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            >
              <option value="all">Everyone</option>
              <option value="staff">Staff only</option>
              <option value="manager">Managers only</option>
              <option value="owner">Owners only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

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
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : existing ? "Save Changes" : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls = {
    slate: "text-slate-700 bg-slate-50",
    emerald: "text-emerald-700 bg-emerald-50",
    orange: "text-orange-700 bg-orange-50",
  }[color] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`${cls} p-4 rounded-2xl border border-slate-200`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
