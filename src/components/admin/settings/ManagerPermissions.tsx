// src/components/admin/settings/ManagerPermissions.tsx
"use client";

import { useEffect, useState } from "react";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Manager {
  email: string;
  name: string;
  role: string;
  photo: string;
  permissions: {
    email: string;
    canVoid: boolean;
    canRefund: boolean;
    canDelete: boolean;
    canEditInventory: boolean;
    canExport: boolean;
    canViewActivity: boolean;
    canManageStaff: boolean;
    canViewProfit: boolean;
    canPrintCustomers: boolean; // ✅ አዲስ
    canPrintSuppliers: boolean; // ✅ አዲስ
  };
}

export default function ManagerPermissions() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      // ✅ cache: 'no-store' — always fresh
      const res = await fetch("/api/settings/permissions", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setManagers(data.managers || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(
    manager: Manager,
    key: keyof Omit<Manager["permissions"], "email">
  ) {
    setSaving(manager.email);
    setError("");
    setSuccess("");

    const updated: Manager = {
      ...manager,
      permissions: {
        ...manager.permissions,
        [key]: !manager.permissions[key],
      },
    };

    try {
      const res = await fetch("/api/settings/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: updated.permissions }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setManagers(managers.map((m) => (m.email === manager.email ? updated : m)));
      setSuccess(`✅ ${manager.name || manager.email} ተዘመነ`);
      setTimeout(() => setSuccess(""), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500">Loading managers…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">🔐 Manager Permissions</h3>
        <p className="text-sm text-slate-500 mt-1">
          ማናጀሮች ምን ማድረግ እንደሚችሉ እዚህ ይወስኑ — ወዲያውኑ ተግባራዊ ይሆናል
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-200">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {managers.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-4xl mb-2">👥</p>
          <p className="text-sm text-slate-500">
            No managers found. Add a manager first via Staff page.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {managers.map((m) => (
            <div key={m.email} className="p-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={formatDriveUrl(m.photo)}
                  alt={m.name}
                  className="w-10 h-10 rounded-full object-cover bg-slate-100"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src = "/placeholder.svg")
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">
                    {m.name || m.email}
                  </p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
              </div>

              {/* Permission toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Toggle
                  label="Void Sales"
                  icon="🚫"
                  enabled={m.permissions.canVoid}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canVoid")}
                />
                <Toggle
                  label="Refund Sales"
                  icon="💵"
                  enabled={m.permissions.canRefund}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canRefund")}
                />
                <Toggle
                  label="Delete Sales"
                  icon="🗑"
                  enabled={m.permissions.canDelete}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canDelete")}
                />
                <Toggle
                  label="Edit Inventory"
                  icon="📦"
                  enabled={m.permissions.canEditInventory}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canEditInventory")}
                />
                <Toggle
                  label="Export Data"
                  icon="📤"
                  enabled={m.permissions.canExport}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canExport")}
                />
                <Toggle
                  label="View Activity Log"
                  icon="📝"
                  enabled={m.permissions.canViewActivity}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canViewActivity")}
                />
                <Toggle
                  label="Manage Staff"
                  icon="🏅"
                  enabled={m.permissions.canManageStaff}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canManageStaff")}
                />
                <Toggle
                  label="View Profit Report"
                  icon="💵"
                  enabled={m.permissions.canViewProfit}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canViewProfit")}
                />
                <Toggle
                  label="Print Customers"
                  icon="🧑"
                  enabled={m.permissions.canPrintCustomers}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canPrintCustomers")}
                />
                <Toggle
                  label="Print Suppliers"
                  icon="🏭"
                  enabled={m.permissions.canPrintSuppliers}
                  loading={saving === m.email}
                  onClick={() => toggle(m, "canPrintSuppliers")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  icon,
  enabled,
  loading,
  onClick,
}: {
  label: string;
  icon: string;
  enabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`p-2 rounded-lg border text-left transition disabled:opacity-50 ${
        enabled
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          {icon} {label}
        </span>
        <span
          className={`w-8 h-4 rounded-full relative transition ${
            enabled ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition ${
              enabled ? "left-4" : "left-0.5"
            }`}
          />
        </span>
      </div>
    </button>
  );
}
