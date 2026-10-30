// src/components/admin/dashboard/LiveClock.tsx
"use client";

import { useEffect, useState } from "react";

export default function LiveClock({ lastUpdate }: { lastUpdate: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live · {now.toLocaleTimeString()}
      </span>
      <span className="hidden sm:inline">·</span>
      <span>
        Updated {secondsAgo < 1 ? "just now" : `${secondsAgo}s ago`}
      </span>
    </div>
  );
}
