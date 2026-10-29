"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import { StaffDisplay, AwardedBadgeDisplay } from "./page";
import ResetPasswordModal from "@/components/admin/ResetPasswordModal";
import SuspendModal from "@/components/admin/SuspendModal";
import EditProfileModal from "@/components/admin/EditProfileModal";
import {
  BADGES, BADGE_MAP,
  groupBadgesByStaff, countBadgeTypes,
} from "@/lib/badge-utils";
import {
  normalizeStatus, STATUS_COLORS, STATUS_LABELS,
  ROLE_COLORS, canManage,
} from "@/lib/staff-control";

type ModalMode = "profile" | "badge" | "reset-password" | "suspend" | "edit" | null;

// Local alias — AwardedBadgeDisplay ከ page.tsx
type AwardedBadge = AwardedBadgeDisplay;

export default function StaffClient({
  initialStaff,
  initialBadges,
}: {
  initialStaff: StaffDisplay[];
  initialBadges: AwardedBadgeDisplay[];
}) {
  const { data: session } = useSession();
  const callerRole = String((session?.user as any)?.role || "staff").toLowerCase();
  const callerEmail = session?.user?.email || "";

  const [staff, setStaff] = useState(initialStaff);
  const [badges, setBadges] = useState(initialBadges);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "manager" | "staff">("all");
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

  const leaderboard = useMemo(
    () =>
      [...staff]
        .map((s) => ({ ...s, badgeCount: (badgesByStaff[s.id] ?? []).length }))
        .filter((s) => s.badgeCount > 0)
        .sort((a, b) => b.badgeCount - a.badgeCount)
        .slice(0, 5),
    [staff, badgesByStaff]
  );

  const stats = {
    total: staff.length,
    active: staff.filter((s) => normalizeStatus(s.status) === "active").length,
    suspended: staff.filter((s) => normalizeStatus(s.status) === "suspended").length,
    totalBadges: badges.length,
  };

  async function refresh() {
    try {
      const [userRes, badgeRes] = await Promise.all([
        fetch("/api/staff/list"),
        fetch("/api/badges"),
      ]);
      if (userRes.ok) {
        const data = await userRes.json();
        if (Array.isArray(data.staff)) setStaff(data.staff);
      }
      if (badgeRes.ok) {
        const data = await badgeRes.json();
        if (data.all) setBadges(data.all);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">👥 Staff Control</h1>
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

      {/* Leaderboard + Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4">🏆 Badge Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No badges yet</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      i === 0 ? "bg-amber-400 text-white" :
                      i === 1 ? "bg-slate-300 text-slate-800" :
                      i === 2 ? "bg-orange-300 text-white" :
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <img
                    src={formatDriveUrl(s.photo)}
                    alt={s.fullName}
                    className="w-9 h-9 rounded-full object-cover bg-slate-100"
                    onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.png")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{s.fullName}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600">🏅 {s.badgeCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4">📊 Badge Breakdown</h2>
          <div className="space-y-2">
            {BADGES.map((b) => {
              const count = badgeTypeCounts[b.id] || 0;
              const max = Math.max(1, ...Object.values(badgeTypeCounts));
              const pct = (count / max) * 100;
              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{b.emoji} {b.label}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${b.color.replace("-100", "-400")}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
          {(["all", "owner", "manager", "staff"] as const).map((f) => (
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
          const can = canManage(callerRole, s.role, callerEmail, s.email);

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
                    onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.png")}
                  />
                  {sBadges.length > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ring-2 ring-white">
                      {sBadges.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{s.fullName}</p>
                  <p className="text-sm text-slate-500 truncate">{s.email}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[s.role.toLowerCase()] ?? "bg-slate-100"}`}>
                      {s.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[st]}`}>
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
                      <span className="text-xs text-slate-400 self-center">+{sBadges.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-3 gap-1">
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
                  <button
                    onClick={() => { setActive(s); setModal("reset-password"); }}
                    className="py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded"
                  >
                    🔑 Reset
                  </button>
                </div>
                {can.allowed && (
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => { setActive(s); setModal("edit"); }}
                      className="py-2 text-xs bg-slate-700 hover:bg-slate-800 text-white font-medium rounded"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => { setActive(s); setModal("suspend"); }}
                      className={`py-2 text-xs font-medium rounded ${
                        isSuspended
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {isSuspended ? "✅ Activate" : "🚫 Block"}
                    </button>
                  </div>
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
          onAwarded={refresh}
        />
      )}
      {modal === "reset-password" && active && (
        <ResetPasswordModal
          targetEmail={active.email}
          targetName={active.fullName}
          onClose={() => { setModal(null); setActive(null); }}
        />
      )}
      {modal === "suspend" && active && (
        <SuspendModal
          targetEmail={active.email}
          targetName={active.fullName}
          currentStatus={active.status}
          onClose={() => { setModal(null); setActive(null); }}
          onSuccess={refresh}
        />
      )}
      {modal === "edit" && active && (
        <EditProfileModal
          targetEmail={active.email}
          targetRole={active.role}
          callerRole={callerRole}
          initialData={{
            userName: active.fullName,
            phone: active.phone,
            role: active.role,
            profilePicture: active.photo,
            status: active.status,
          }}
          onClose={() => { setModal(null); setActive(null); }}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

// ─── Modal components ───

function ProfileModal({
  staff, badges, onClose,
}: { staff: StaffDisplay; badges: AwardedBadge[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">👤 Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <img
            src={formatDriveUrl(staff.photo)}
            alt={staff.fullName}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-500 bg-slate-100"
            onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.png")}
          />
          <div>
            <p className="font-bold text-slate-900 text-lg">{staff.fullName}</p>
            <p className="text-sm text-slate-500">{staff.email}</p>
            <p className="text-sm text-slate-500 capitalize">{staff.role} · {staff.jobRole || "—"}</p>
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
                      {b.note && <p className="text-xs text-slate-600 mt-0.5 italic">"{b.note}"</p>}
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

function BadgeModal({
  staff, onClose, onAwarded,
}: { staff: StaffDisplay; onClose: () => void; onAwarded: () => void }) {
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
        </div>
        <p className="text-sm text-slate-500">Award to: <strong>{staff.fullName}</strong></p>
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

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls = {
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
