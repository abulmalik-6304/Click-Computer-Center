// src/components/admin/settings/EmployeePermissions.tsx
"use client";

import { useEffect, useState } from "react";

interface EmployeeUser {
  email: string;
  name: string;
  role: string;
  photo: string;
  permissions: {
    email: string;
    canAccessEmployeeDashboard: boolean;
    canRegisterSale: boolean;
    canRegisterIncome: boolean;
    canViewAnnouncements: boolean;
    canCreateAnnouncements: boolean;
  };
}

interface Props {
  canManage: boolean;
}

export default function EmployeePermissions({ canManage }: Props) {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/employee-permissions", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setEmployees(data.employees || []);
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
    emp: EmployeeUser,
    key: keyof Omit<EmployeeUser["permissions"], "email">
  ) {
    if (!canManage) return;
    setSaving(emp.email);
    setError("");
    setSuccess("");

    const updated: EmployeeUser = {
      ...emp,
      permissions: {
        ...emp.permissions,
        [key]: !emp.permissions[key],
      },
    };

    try {
      const res = await fetch("/api/settings/employee-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: updated.permissions }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setEmployees(
        employees.map((e) => (e.email === emp.email ? updated : e))
      );
      setSuccess(`✅ ${emp.name || emp.email} ተዘመነ`);
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
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500">
          Loading employees…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">
          👥 Employee / Staff Permissions
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          ሰራተኞች ምን ማድረግ እንደሚችሉ እዚህ ይወስኑ
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

      {employees.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-4xl mb-2">👥</p>
          <p className="text-sm text-slate-500">
            No employees found.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {employees.map((e) => (
            <div key={e.email} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {e.photo ? (
                  <img
                    src={e.photo}
                    alt={e.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {e.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">
                    {e.name || e.email}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {e.email} · {e.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Toggle
                  label="Dashboard Access"
                  icon="🏠"
                  enabled={e.permissions.canAccessEmployeeDashboard}
                  loading={saving === e.email}
                  onClick={() => toggle(e, "canAccessEmployeeDashboard")}
                />
                <Toggle
                  label="Register Sale"
                  icon="🛒"
                  enabled={e.permissions.canRegisterSale}
                  loading={saving === e.email}
                  onClick={() => toggle(e, "canRegisterSale")}
                />
                <Toggle
                  label="Register Income"
                  icon="💰"
                  enabled={e.permissions.canRegisterIncome}
                  loading={saving === e.email}
                  onClick={() => toggle(e, "canRegisterIncome")}
                />
                <Toggle
                  label="View Announcements"
                  icon="📢"
                  enabled={e.permissions.canViewAnnouncements}
                  loading={saving === e.email}
                  onClick={() => toggle(e, "canViewAnnouncements")}
                />
                <Toggle
                  label="Create Announcements"
                  icon="✉️"
                  enabled={e.permissions.canCreateAnnouncements}
                  loading={saving === e.email}
                  onClick={() => toggle(e, "canCreateAnnouncements")}
                />
              </div>

              {/* 🔒 Locked items */}
              <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500">
                🔒 Reports, Print, and Admin pages are <strong>always blocked</strong> for employees.
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
