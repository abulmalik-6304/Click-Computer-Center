// src/components/admin/dashboard/TrendCard.tsx
"use client";

interface Props {
  label: string;
  value: number;
  delta: number;         // percent change vs yesterday
  icon: string;
  color: "emerald" | "orange" | "red" | "slate";
  sub?: string;
  invertDelta?: boolean; // for cost/expenses, going up is bad
}

export default function TrendCard({
  label, value, delta, icon, color, sub, invertDelta = false,
}: Props) {
  const isUp = delta >= 0;
  const isGood = invertDelta ? !isUp : isUp;

  const colorMap = {
    emerald: "text-emerald-600",
    orange: "text-orange-600",
    red: "text-red-600",
    slate: "text-slate-700",
  };
  const badgeMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="text-2xl">{icon}</div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeMap[color]}`}>
          Today
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl sm:text-3xl font-bold ${colorMap[color]}`}>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        <span className="text-xs sm:text-sm text-slate-400 ml-1">ETB</span>
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isGood
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {isUp ? "↗" : "↘"} {Math.abs(delta).toFixed(1)}%
        </span>
        <span className="text-xs text-slate-400">vs yesterday</span>
      </div>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
