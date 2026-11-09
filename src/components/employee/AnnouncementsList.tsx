// src/components/employee/AnnouncementsList.tsx
"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  date: string;
  image: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
}

export default function AnnouncementsList({
  userEmail,
}: {
  userEmail: string;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAsRead(id: string) {
    setMarking(id);
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_read",
          announcementId: id,
        }),
      });
      setAnnouncements(
        announcements.map((a) =>
          a.id === id ? { ...a, isRead: true } : a
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-slate-500">No announcements yet</p>
        <p className="text-xs text-slate-400 mt-2">
          Check back later for updates from management
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <div
          key={a.id}
          className={`bg-white rounded-2xl border p-5 ${
            a.priority === "urgent"
              ? "border-red-300 bg-red-50/30"
              : a.priority === "high"
              ? "border-orange-300 bg-orange-50/30"
              : a.isRead
              ? "border-slate-200"
              : "border-blue-300 bg-blue-50/30"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-bold text-slate-900 flex items-center gap-1">
              {!a.isRead && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded">
                  NEW
                </span>
              )}
              {a.priority === "urgent" && "🚨 "}
              {a.priority === "high" && "🔴 "}
              {a.title}
            </h2>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {new Date(a.date).toLocaleDateString()}
            </span>
          </div>
          {a.image && (
            <img
              src={a.image}
              alt={a.title}
              className="w-full max-h-64 object-cover rounded-lg mb-3"
            />
          )}
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {a.message}
          </p>

          {!a.isRead && (
            <button
              onClick={() => markAsRead(a.id)}
              disabled={marking === a.id}
              className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded disabled:opacity-50"
            >
              {marking === a.id ? "⏳ Marking…" : "✅ Mark as Read"}
            </button>
          )}
          {a.isRead && (
            <p className="mt-2 text-xs text-emerald-600">✅ Read</p>
          )}
        </div>
      ))}
    </div>
  );
}
