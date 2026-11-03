// src/app/admin/staff/StaffClient.tsx
"use client";

import { useMemo, useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import {
  BADGES, BADGE_MAP,
  groupBadgesByStaff, countBadgeTypes,
} from "@/lib/badge-utils";
import {
  normalizeStatus, STATUS_COLORS, STATUS_LABELS,
  ROLE_COLORS,
} from "@/lib/staff-control";
import { StaffDisplay, AwardedBadgeDisplay } from "./page";

type AwardedBadge = AwardedBadgeDisplay;
type ModalMode = "profile" | "badge" | "edit" | null;

export default function StaffClient({
  initialStaff,
  initialBadges,
  userRole,
  userEmail,
  isOwner,
}: {
  initialStaff: StaffDisplay[];
  initialBadges: AwardedBadgeDisplay[];
  userRole: string;
  userEmail: string;
  isOwner: boolean;
}) {
  const [staff, setStaff] = useState(initialStaff);
  const [badges, setBadges] = useState(initialBadges);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "manager" | "employee" | "staff">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<StaffDisplay | null>(null);

  const badgesByStaff = useMemo(() => groupBadgesByStaff(badges as any), [badges]);
  const badgeTypeCounts = useMemo(() => countBadgeTypes(badges as any), [badges]);

  const filtered = useMemo(() => {
    let out = staff;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (s) =>
          s.fullName.toLowerCase().includes(lq) ||
          s.email.toLowerCase().includes(lq) ||
          s.jobRole.toLowerCase().includes(lq)
      );
    }
    if (roleFilter !== "all") out = out.filter((s) => s.role.toLowerCase() === roleFilter);
    if (statusFilter !== "all") {
      out = out.filter((s) => {
        const st = normalizeStatus(s.status);
        if (statusFilter === "active") return st === "active";
        return st === "suspended";
      });
    }
    return out;
  }, [staff, q, roleFilter, statusFilter]);

  const stats = {
    total: staff.length,
    active: staff.filter((s) => normalizeStatus(s.status) === "active").length,
    suspended: staff.filter((s) => normalizeStatus(s.status) === "suspended").length,
    totalBadges: badges.length,
  };

  async function refresh() {
    try {
      const res = await fetch("/api/staff/list");
      const data = await res.json();
      if (Array.isArray(data.staff)) setStaff(data.staff);
    } catch (e) {
      console.error(e);
    }
  }

  async function refreshBadges() {
    try {
      const res = await fetch("/api/badges");
      const data = await res.json();
      if (data.all) setBadges(data.all);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🏅 Staff & Badges</h1>
        <p className="text-sm text-slate-500 mt-1">
          {stats.total} members · {stats.active} active · {stats.suspended} suspended · {stats.totalBadges} badges
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="Active" value={stats.active} color="emerald" />
        <StatCard label="Suspended" value={stats.suspended} color="red" />
        <StatCard label="Badges" value={stats.totalBadges} color="amber" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, email, or role…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-slate-500 self-center">Role:</span>
          {(["all", "owner", "manager", "employee", "staff"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                roleFilter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="text-xs font-semibold text-slate-500 self-center ml-2">Status:</span>
          {(["all", "active", "suspended"] as const).map((f) => (
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

      {/* Staff Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => {
          const sBadges = badgesByStaff[s.id] ?? [];
          const st = normalizeStatus(s.status);
          const isSuspended = st === "suspended";
          const isSelf = s.email.toLowerCase() === userEmail.toLowerCase();

          return (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                isSuspended ? "border-red-200 bg-red-50/30" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={formatDriveUrl(s.photo)}
                    alt={s.fullName}
                    className={`w-14 h-14 rounded-full object-cover bg-slate-100 flex-shrink-0 ${
                      isSuspended ? "ring-2 ring-red-400 grayscale" : "ring-2 ring-orange-500"
                    }`}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "/placeholder.svg")
                    }
                  />
                  {sBadges.length > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ring-2 ring-white">
                      {sBadges.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {s.fullName}
                    {isSelf && <span className="text-xs text-slate-400 ml-1">(You)</span>}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{s.email}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        ROLE_COLORS[s.role.toLowerCase()] ?? "bg-slate-100"
                      }`}
                    >
                      {s.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[st]}`}
                    >
                      {STATUS_LABELS[st]}
                    </span>
                  </div>
                </div>
              </div>

              {sBadges.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {sBadges.slice(0, 3).map((b, idx) => {
                      const def = BADGE_MAP[b.badgeId];
                      if (!def) return null;
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${def.color} ${def.textColor}`}
                        >
                          {def.emoji} {def.label}
                        </span>
                      );
                    })}
                    {sBadges.length > 3 && (
                      <span className="text-xs text-slate-400 self-center">
                        +{sBadges.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => { setActive(s); setModal("profile"); }}
                    className="py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded"
                  >
                    👤 View
                  </button>
                  <button
                    onClick={() => { setActive(s); setModal("badge"); }}
                    className="py-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium rounded"
                  >
                    🏅 Badge
                  </button>
                </div>

                {/* Edit button — hide for self */}
                {!isSelf && (
                  <button
                    onClick={() => { setActive(s); setModal("edit"); }}
                    className="w-full py-2 text-xs bg-slate-700 hover:bg-slate-800 text-white font-medium rounded"
                  >
                    ✏️ Edit Profile {isOwner && "& Role"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal === "profile" && active && (
        <ProfileModal
          staff={active}
          badges={badgesByStaff[active.id] ?? []}
          onClose={() => { setModal(null); setActive(null); }}
        />
      )}
      {modal === "badge" && active && (
        <BadgeModal
          staff={active}
          onClose={() => { setModal(null); setActive(null); }}
          onAwarded={refreshBadges}
        />
      )}
      {modal === "edit" && active && (
        <EditStaffModal
          staff={active}
          canEditRole={isOwner}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Edit Staff Modal ───
function EditStaffModal({
  staff,
  canEditRole,
  onClose,
  onSaved,
}: {
  staff: StaffDisplay;
  canEditRole: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    userName: staff.fullName,
    phone: staff.phone || "",
    role: staff.role.toLowerCase(),
    profilePicture: staff.photo || "",
    status: staff.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/staff/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: staff.email,
          updates: {
            userName: form.userName,
            phone: form.phone,
            profilePicture: form.profilePicture,
            status: form.status,
            ...(canEditRole ? { role: form.role } : {}),
          },
        }),
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">✏️ Edit Staff</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Profile Picture URL
          </label>
          <input
            type="text"
                        value={form.profilePicture}
            onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        {/* Role — only owner can edit */}
        {canEditRole && (
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
              <option value="manager">Manager</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              ⚠️ Only owner can change roles
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            <option value="Active">✅ Active</option>
            <option value="Suspended">🚫 Suspended</option>
            <option value="Inactive">⚪ Inactive</option>
          </select>
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
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Profile View Modal ───
function ProfileModal({
  staff,
  badges,
  onClose,
}: {
  staff: StaffDisplay;
  badges: AwardedBadge[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">👤 Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <img
            src={formatDriveUrl(staff.photo)}
            alt={staff.fullName}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-500 bg-slate-100"
            onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")}
          />
          <div>
            <p className="font-bold text-slate-900 text-lg">{staff.fullName}</p>
            <p className="text-sm text-slate-500">{staff.email}</p>
            <p className="text-sm text-slate-500 capitalize">
              {staff.role} · {staff.jobRole || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Phone" value={staff.phone || "—"} />
          <InfoRow label="Status" value={staff.status} />
          <InfoRow label="Job Role" value={staff.jobRole || "—"} />
          <InfoRow label="Last Seen" value={staff.lastSeen || "—"} />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-3">🏅 Badges ({badges.length})</h3>
          {badges.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No badges yet</p>
          ) : (
            <div className="space-y-2">
              {badges.map((b, i) => {
                const def = BADGE_MAP[b.badgeId];
                if (!def) return null;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${def.color}`}>
                    <span className="text-2xl">{def.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${def.textColor}`}>{def.label}</p>
                      {b.note && (
                        <p className="text-xs text-slate-600 mt-0.5 italic">"{b.note}"</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(b.assignedAt).toLocaleDateString()} · by {b.assignedBy || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Badge Award Modal ───
function BadgeModal({
  staff,
  onClose,
  onAwarded,
}: {
  staff: StaffDisplay;
  onClose: () => void;
  onAwarded: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function award() {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff.id,
          staffName: staff.fullName,
          badges: selected,
          note,
          assignedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        onAwarded();
        onClose();
      } else {
        alert("Could not save badge");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">🏅 Award Badge</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Award to: <strong>{staff.fullName}</strong>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => (
            <button
              key={b.id}
              onClick={() =>
                setSelected((s) => (s.includes(b.id) ? s.filter((x) => x !== b.id) : [...s, b.id]))
              }
              className={`p-3 rounded-lg text-sm font-medium border text-left ${
                selected.includes(b.id)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{b.emoji}</span>
                <span className="truncate">{b.label}</span>
              </div>
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Recognition note (optional)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={award}
            disabled={selected.length === 0 || saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : `Award (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───
function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls =
    {
      slate: "text-slate-700 bg-slate-50",
      orange: "text-orange-700 bg-orange-50",
      emerald: "text-emerald-700 bg-emerald-50",
      amber: "text-amber-700 bg-amber-50",
      red: "text-red-700 bg-red-50",
    }[color] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`${cls} p-4 rounded-2xl border border-slate-200`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
