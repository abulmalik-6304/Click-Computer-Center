// src/components/admin/PasswordInput.tsx
"use client";

import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  autoComplete?: string;
  showStrength?: boolean;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  required,
  label,
  autoComplete = "new-password",
  showStrength = false,
}: Props) {
  const [show, setShow] = useState(false);

  // Strength indicator
  const score = (() => {
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[a-z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  })();

  const strengthColor =
    score <= 2 ? "bg-red-500" : score === 3 ? "bg-orange-500" : score === 4 ? "bg-yellow-500" : "bg-emerald-500";
  const strengthLabel =
    score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${strengthColor} transition-all`}
              style={{ width: `${(score / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Strength: {strengthLabel}</p>
        </div>
      )}
    </div>
  );
}
