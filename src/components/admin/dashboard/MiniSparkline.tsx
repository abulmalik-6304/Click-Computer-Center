// src/components/admin/dashboard/MiniSparkline.tsx
"use client";

interface Point {
  date: string;
  revenue: number;
  profit: number;
}

export default function MiniSparkline({
  data,
  title,
}: {
  data: Point[];
  title: string;
}) {
  if (data.length === 0) return null;

  const width = 400;
  const height = 80;
  const pad = 6;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxProfit = Math.max(...data.map((d) => d.profit), 1);
  const max = Math.max(maxRevenue, maxProfit);

  const stepX = (width - pad * 2) / Math.max(1, data.length - 1);

  const buildPath = (key: "revenue" | "profit") =>
    data
      .map((d, i) => {
        const x = pad + i * stepX;
        const y = height - pad - (d[key] / max) * (height - pad * 2);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">Last 7 days</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        {/* Baseline */}
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        {/* Revenue line */}
        <path
          d={buildPath("revenue")}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Profit line */}
        <path
          d={buildPath("profit")}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((d, i) => {
          const x = pad + i * stepX;
          const ry = height - pad - (d.revenue / max) * (height - pad * 2);
          const py = height - pad - (d.profit / max) * (height - pad * 2);
          return (
            <g key={d.date}>
              <circle cx={x} cy={ry} r="2.5" fill="#10b981" />
              <circle cx={x} cy={py} r="2.5" fill="#f97316" />
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Profit
          </span>
        </div>
        <div className="flex gap-2">
          {data.map((d) => (
            <span key={d.date} className="text-slate-400">
              {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
