"use client";
import { useState } from "react";
import { toDriveImageUrl } from "@/lib/drive-url";

const BADGE_LIBRARY = [
  "Top Seller",
  "Fastest Repairs",
  "Customer Hero",
  "Zero Errors",
  "Team Player",
];

export function BadgeAssigner({
  staffId,
  staffName,
  avatar,
}: {
  staffId: string;
  staffName: string;
  avatar: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  async function assign() {
    await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId,
        badges: selected,
        note,
        assignedAt: new Date().toISOString(),
      }),
    });
    alert("Badge(s) awarded ✅");
    setSelected([]);
    setNote("");
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
      <div className="flex items-center gap-4">
        <img
          src={toDriveImageUrl(avatar)}
          alt={staffName}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-500"
        />
        <div>
          <p className="font-bold text-slate-900">{staffName}</p>
          <p className="text-xs text-slate-500">{staffId}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGE_LIBRARY.map((b) => (
          <button
            key={b}
            onClick={() =>
              setSelected((s) =>
                s.includes(b) ? s.filter((x) => x !== b) : [...s, b]
              )
            }
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              selected.includes(b)
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            {b}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Recognition note (optional)…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
      />
      <button
        onClick={assign}
        disabled={!selected.length}
        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
      >
        Award Badge(s)
      </button>
    </div>
  );
}
