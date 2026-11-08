// src/components/admin/income/IncomeFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  INCOME_SOURCES,
  getCategoriesForSource,
} from "@/lib/income-categories";
import {
  IncomeMaterial,
  calculateMaterialCost,
  calculateNetIncome,
} from "@/lib/income-types";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  image: string;
  costPrice: number;
  packSize: number;
  stock: number;
  unitType: string;
}

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export default function IncomeFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [incomeSource, setIncomeSource] = useState("maintain");
  const [incomeCategory, setIncomeCategory] = useState("epson-printer");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");

  const [materials, setMaterials] = useState<IncomeMaterial[]>([]);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableCategories = useMemo(
    () => getCategoriesForSource(incomeSource),
    [incomeSource]
  );

  const totalPrice = price * quantity;
  const totalMaterialCost = materials.reduce((s, m) => s + m.materialCost, 0);
  const netIncome = calculateNetIncome(totalPrice, totalMaterialCost);

  // Load inventory
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/inventory/refresh", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.items)) setInventory(data.items);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const filteredMaterials = useMemo(() => {
    if (!materialSearch.trim()) return inventory;
    const lq = materialSearch.toLowerCase().trim();
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(lq) || i.code.toLowerCase().includes(lq)
    );
  }, [inventory, materialSearch]);

  function handleSourceChange(newSource: string) {
    const cats = getCategoriesForSource(newSource);
    setIncomeSource(newSource);
    setIncomeCategory(cats[0]?.value || "");
  }

  function addMaterial(item: InventoryItem) {
    const existing = materials.findIndex((m) => m.itemId === item.id);
    if (existing >= 0) {
      setShowMaterialPicker(false);
      setMaterialSearch("");
      return;
    }
    setMaterials([
      ...materials,
      {
        itemId: item.id,
        itemName: item.name,
        itemImage: item.image,
        costPrice: item.costPrice,
        packSize: item.packSize || 1,
        usedQty: 1,
        materialCost: item.costPrice,
      },
    ]);
    setShowMaterialPicker(false);
    setMaterialSearch("");
  }

  function updateMaterialField(
    index: number,
    field: "usedQty" | "costPrice" | "packSize",
    value: number
  ) {
    setMaterials(
      materials.map((m, i) => {
        if (i !== index) return m;
        const updated = { ...m, [field]: value };
        updated.materialCost = calculateMaterialCost(
          updated.costPrice,
          updated.packSize,
          updated.usedQty
        );
        return updated;
      })
    );
  }

  function updateMaterialCostDirect(index: number, value: number) {
    setMaterials(
      materials.map((m, i) => (i === index ? { ...m, materialCost: value } : m))
    );
  }

  function removeMaterial(index: number) {
    setMaterials(materials.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (price <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          incomeSource,
          incomeCategory,
          price,
          quantity,
          description,
          materials,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      {/* ═══════ PORTRAIT MODAL ═══════ */}
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">💰 Add Income</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {new Date(date).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-100 hover:text-white text-xl p-1 rounded-lg hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY — SCROLLABLE */}
        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {/* ═══════ SECTION 1: DATE + SOURCE + CATEGORY ═══════ */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              📅 Basic Info
            </h3>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Source *
              </label>
              <select
                value={incomeSource}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Category *
              </label>
              <select
                value={incomeCategory}
                onChange={(e) => setIncomeCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                {availableCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* ═══════ SECTION 2: PRICE + QTY + TOTAL ═══════ */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              💵 Price & Quantity
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Total */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">
                Total Price
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {fmt(totalPrice)} ETB
              </span>
            </div>
          </section>

          {/* ═══════ SECTION 3: MATERIALS (Expandable) ═══════ */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <button
              type="button"
              onClick={() => setShowMaterialPicker(true)}
              className="w-full flex items-center justify-between px-3 py-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📦</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">
                    Materials Used
                  </p>
                  <p className="text-xs text-slate-500">
                    {materials.length === 0
                      ? "No materials — tap to add"
                      : `${materials.length} material${materials.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                + Add
              </span>
            </button>

            {/* Materials List */}
            {materials.length > 0 && (
              <div className="border-t border-slate-100 p-2 space-y-2 bg-slate-50">
                {materials.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg border border-slate-200 p-2"
                  >
                    {/* Item header */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={formatDriveUrl(m.itemImage)}
                        alt={m.itemName}
                        className="w-9 h-9 rounded object-cover bg-slate-100 flex-shrink-0"
                        onError={(e) =>
                          ((e.target as HTMLImageElement).src = "/placeholder.svg")
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {m.itemName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMaterial(idx)}
                        className="text-red-500 hover:text-red-700 text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Fields grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Cost Price */}
                      <div>
                        <label className="text-xs text-slate-500">
                          Cost Price
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={m.costPrice || ""}
                          onChange={(e) =>
                            updateMaterialField(
                              idx,
                              "costPrice",
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                        />
                      </div>

                      {/* Pack Size */}
                      <div>
                        <label className="text-xs text-slate-500">
                          Pack Size
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={m.packSize || ""}
                          onChange={(e) =>
                            updateMaterialField(
                              idx,
                              "packSize",
                              Number(e.target.value) || 1
                            )
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                        />
                      </div>

                      {/* Used Qty */}
                      <div>
                        <label className="text-xs text-slate-500">
                          Used Qty
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={m.usedQty || ""}
                          onChange={(e) =>
                            updateMaterialField(
                              idx,
                              "usedQty",
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                        />
                      </div>

                      {/* Material Cost */}
                      <div>
                        <label className="text-xs text-slate-500">
                          Material Cost
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={m.materialCost || ""}
                          onChange={(e) =>
                            updateMaterialCostDirect(
                              idx,
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-full rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Material Cost */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-800">
                    Total Material Cost
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    − {fmt(totalMaterialCost)} ETB
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ═══════ SECTION 4: NET INCOME ═══════ */}
          <section
            className={`rounded-xl border-2 p-3 ${
              netIncome >= 0
                ? "bg-emerald-50 border-emerald-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Net Income
                </p>
                <p className="text-xs text-slate-500">
                  Total − Material Cost
                </p>
              </div>
              <p
                className={`text-2xl font-bold ${
                  netIncome >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {fmt(netIncome)}
                <span className="text-sm ml-1">ETB</span>
              </p>
            </div>
          </section>

          {/* ═══════ SECTION 5: DESCRIPTION ═══════ */}
          <section className="bg-white rounded-xl border border-slate-200 p-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              📝 Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes about this income…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </section>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">❌ {error}</p>
            </div>
          )}
        </form>

        {/* FOOTER — Sticky */}
        <div className="bg-white border-t border-slate-200 p-3 rounded-b-2xl flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit as any}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save · ${fmt(netIncome)} ETB`}
          </button>
        </div>
      </div>

      {/* ═══════ MATERIAL PICKER MODAL ═══════ */}
      {showMaterialPicker && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">📦 Select Material</h3>
              <button
                type="button"
                onClick={() => {
                  setShowMaterialPicker(false);
                  setMaterialSearch("");
                }}
                className="text-slate-400 hover:text-slate-900 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-200">
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="🔍 Search by name or code…"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredMaterials.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  No materials found
                </p>
              ) : (
                filteredMaterials.slice(0, 30).map((item) => {
                  const alreadyAdded = materials.some((m) => m.itemId === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => !alreadyAdded && addMaterial(item)}
                      disabled={alreadyAdded || item.stock <= 0}
                      className="w-full text-left p-2 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2 disabled:opacity-40"
                    >
                      <img
                        src={formatDriveUrl(item.image)}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover bg-slate-100 flex-shrink-0"
                        onError={(e) =>
                          ((e.target as HTMLImageElement).src = "/placeholder.svg")
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.code} · Stock: {item.stock}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-emerald-600">
                          {item.costPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          ETB / {item.packSize || 1}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
