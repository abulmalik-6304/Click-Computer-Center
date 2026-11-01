// src/app/admin/inventory/InventoryClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

  // Auto-refresh when window regains focus (e.g. after POS sale)
  useEffect(() => {
    function handleFocus() {
      refresh();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

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
      const res = await fetch("/api/inventory/refresh", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items.filter((i: any) => i.status !== "Archived"));
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
          <div className="flex gap-2">
            {(["all", "low", "out"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "All" : f === "low" ? "Low" : "Out"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                view === "cards" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              🎴 Cards
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                view === "table" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              📋 Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-slate-500">No items found</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              canSell={canSell}
              onClick={() => setDetailId(item.id)}
              onSell={() => handleSell(item)}
              onEdit={() => { setActive(item); setModal("edit"); }}
              onStockIn={() => { setActive(item); setModal("stock-in"); }}
            />
          ))}
        </div>
      ) : (
        <ItemTable
          items={filtered}
          canEdit={canEdit}
          canSell={canSell}
          onView={(item) => setDetailId(item.id)}
          onSell={handleSell}
        />
      )}

      {/* Modals */}
      {modal === "add" && (
        <ItemFormModal
          mode="add"
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal === "edit" && active && (
        <ItemFormModal
          mode="edit"
          item={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
      {modal === "stock-in" && active && (
        <ItemFormModal
          mode="stock-in"
          item={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
      {detailId && (
        <ItemDetailModal
          itemId={detailId}
          userRole={userRole}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

// ─── Item Card ───
function ItemCard({
  item,
  canEdit,
  canSell,
  onClick,
  onSell,
  onEdit,
  onStockIn,
}: {
  item: InventoryItem;
  canEdit: boolean;
  canSell: boolean;
  onClick: () => void;
  onSell: () => void;
  onEdit: () => void;
  onStockIn: () => void;
}) {
  const stockBadge = getStockBadge(item);
  const margin = getProfitMargin(item);
  const out = getStockStatus(item) === "out";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition flex flex-col">
      {/* Image — click to open detail */}
      <button
        onClick={onClick}
        className="relative aspect-square bg-slate-100 overflow-hidden w-full"
      >
        <img
          src={formatDriveUrl(item.image)}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition duration-300"
          onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")}
        />
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${stockBadge.color}`}
        >
          {stockBadge.emoji} {stockBadge.label}
        </span>
        {canEdit && margin > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
            +{margin}%
          </span>
        )}
      </button>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <button onClick={onClick} className="text-left">
          <p className="font-semibold text-slate-900 truncate text-sm">{item.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {item.code} · {item.category}
          </p>
        </button>

        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-lg font-bold text-emerald-600">
            {item.sellingPrice.toLocaleString()}
            <span className="text-xs text-slate-400 ml-1">ETB</span>
          </p>
          {canEdit && (
            <p className="text-xs text-slate-400">
              Cost: {item.costPrice.toLocaleString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
          {canSell && (
            <button
              onClick={onSell}
              disabled={out}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🛒 Sell
            </button>
          )}
          {canEdit && (
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={onStockIn}
                className="py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded"
              >
                ➕ Stock In
              </button>
              <button
                onClick={onEdit}
                className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded"
              >
                ✏️ Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Table View ───
function ItemTable({
  items,
  canEdit,
  canSell,
  onView,
  onSell,
}: {
  items: InventoryItem[];
  canEdit: boolean;
  canSell: boolean;
  onView: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left px-3 py-3 font-semibold">Item</th>
              <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">
                Code
              </th>
              {canEdit && (
                <th className="text-right px-3 py-3 font-semibold">Cost</th>
              )}
              <th className="text-right px-3 py-3 font-semibold">Sell</th>
              {canEdit && (
                <th className="text-right px-3 py-3 font-semibold hidden sm:table-cell">
                  Margin
                </th>
              )}
              <th className="text-right px-3 py-3 font-semibold">Stock</th>
              <th className="text-right px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const stockBadge = getStockBadge(item);
              const margin = getProfitMargin(item);
              const out = getStockStatus(item) === "out";
              return (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={formatDriveUrl(item.image)}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                        onError={(e) =>
                          ((e.target as HTMLImageElement).src = "/placeholder.svg")
                        }
                      />
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 md:hidden">
                          {item.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600 hidden md:table-cell">
                    {item.code}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-3 text-right text-slate-700">
                      {item.costPrice.toFixed(2)}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right font-medium text-slate-900">
                    {item.sellingPrice.toFixed(2)}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      <span
                        className={`text-xs font-semibold ${
                          margin >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${stockBadge.color}`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onView(item)}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                        title="View details"
                      >
                        👁
                      </button>
                      {canSell && (
                        <button
                          onClick={() => onSell(item)}
                          disabled={out}
                          className="px-2 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded disabled:opacity-40"
                          title="Sell"
                        >
                          🛒
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  const cls =
    {
      slate: "text-slate-700 bg-slate-50",
      orange: "text-orange-700 bg-orange-50",
      red: "text-red-700 bg-red-50",
      emerald: "text-emerald-700 bg-emerald-50",
    }[color] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`${cls} p-4 rounded-2xl border border-slate-200`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
