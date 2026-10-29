// src/app/admin/settings/SettingsClient.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import ChangePasswordModal from "@/components/admin/ChangePasswordModal";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Props {
  user: {
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
}

export default function SettingsClient({ user }: Props) {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          ⚙️ Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile and security
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <img
            src={formatDriveUrl(user.image)}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-500 bg-slate-100"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = "/placeholder.png")
            }
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <span
              className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                user.role === "owner"
                  ? "bg-orange-100 text-orange-700"
                  : user.role === "manager"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">🔐 Security</h3>
          <p className="text-sm text-slate-500 mt-1">
            Protect your account with a strong password
          </p>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Password</p>
            <p className="text-sm text-slate-500">
              Last changed: unknown (managed in sheet)
            </p>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Session */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">🚪 Session</h3>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Sign Out</p>
            <p className="text-sm text-slate-500">
              End your session on this device
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="text-center text-xs text-slate-400 pt-4">
        Click Computer Center · Enterprise Console v1.0
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
