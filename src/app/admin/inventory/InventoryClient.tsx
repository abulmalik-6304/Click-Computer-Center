// src/app/admin/inventory/InventoryClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";
import {
  getStockBadge,
  getProfitMargin,
  getStockStatus,
} from "@/lib/inventory-helpers";
import { InventoryItem } from "./page";
import ItemDetailModal from "./ItemDetailModal";
import ItemFormModal from "./ItemFormModal";
import ActivityPanel from "./ActivityPanel";

type ModalMode = "add" | "edit" | "stock-in" | null;

export default function InventoryClient({
  initialItems,
  userRole,
}: {
  initialItems: InventoryItem[];
  userRole: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<InventoryItem | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  const isOwner = userRole === "owner";
  const canEdit = ["owner", "manager"].includes(userRole);
  const canSell = ["owner", "manager", "employee", "staff"].includes(userRole);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(lq) ||
          i.code.toLowerCase().includes(lq) ||
          i.category.toLowerCase().includes(lq)
      );
    }
    if (filter === "low") out = out.filter((i) => getStockStatus(i) === "low");
    if (filter === "out") out = out.filter((i) => getStockStatus(i) === "out");
    return out;
  }, [items, q, filter]);

  const stats = {
    total: items.length,
    low: items.filter((i) => getStockStatus(i) === "low").length,
    out: items.filter((i) => getStockStatus(i) === "out").length,
    value: canEdit
      ? items.reduce((sum, i) => sum + i.stock * i.costPrice, 0)
      : 0,
  };

  async function refresh() {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data.filter((i: any) => i.Status !== "Archived"));
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleSell(item: InventoryItem) {
    router.push(`/admin/sales?item=${item.id}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📦 Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} items · {stats.low} low · {stats.out} out
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <button
              onClick={() => setShowActivity((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition ${
                showActivity
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              📝 Activity Log
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => { setActive(null); setModal("add"); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm"
            >
              + Add Item
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.total} color="slate" />
        <StatCard label="Low Stock" value={stats.low} color="orange" />
        <StatCard label="Out of Stock" value={stats.out} color="red" />
        {canEdit && (
          <StatCard
            label="Inventory Value"
            value={`${stats.value.toLocaleString()} ETB`}
            color="emerald"
          />
        )}
      </div>

      {/* Activity Panel (owner only) */}
      {showActivity && isOwner && <ActivityPanel />}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search by name, code, category…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
          <div className="flex gap-
