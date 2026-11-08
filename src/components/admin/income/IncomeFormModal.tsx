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

  // Load inventory for material picker
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
    // Prevent duplicates (update existing)
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

  function updateMaterial(index: number, usedQty: number) {
    setMaterials(
      materials.map((m, i) => {
        if (i !== index) return m;
        return {
          ...m,
          usedQty,
          materialCost: calculateMaterialCost(m.costPrice, m.packSize, usedQty),
        };
      })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">💰 Add Income</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Income Source *</label>
          <select
            value={incomeSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Income Category *</label>
          <select
            value={incomeCategory}
            onChange={(e) => setIncomeCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            {availableCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Price (per unit) *</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={price || ""}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
          <p className="text-xs text-slate-500 mt-1">
            Total Price: {totalPrice.toLocaleString()} ETB
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional notes about this income…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>

        {/* ═══ MATERIALS SECTION ═══ */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              📦 Materials Used ({materials.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowMaterialPicker(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
            >
              + Add Material
            </button>
          </div>

          {materials.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center border-2 border-dashed border-slate-200 rounded-lg">
              No materials — pure service income
            </p>
          ) : (
            <div className="space-y-2">
              {materials.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={formatDriveUrl(m.itemImage)}
                      alt={m.itemName}
                      className="w-10 h-10 rounded object-cover bg-slate-100"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src = "/placeholder.svg")
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {m.itemName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Pack: {m.packSize} · Cost: {m.costPrice.toLocaleString()} ETB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-600">Used Qty</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={m.usedQty}
                        onChange={(e) =>
                          updateMaterial(idx, Number(e.target.value) || 0)
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">
                        Material Cost (auto)
                      </label>
                      <div className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-sm font-semibold text-emerald-700">
                        {m.materialCost.toLocaleString()} ETB
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-slate-200 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Gross Income:</span>
            <span className="font-medium">{totalPrice.toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Material Cost:</span>
            <span className="font-medium text-red-600">
              − {totalMaterialCost.toLocaleString()} ETB
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold">
            <span>Net Income:</span>
            <span className={netIncome >= 0 ? "text-emerald-600" : "text-red-600"}>
              {netIncome.toLocaleString()} ETB
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save Income · ${netIncome.toLocaleString()} ETB`}
          </button>
        </div>
      </form>

      {/* Material Picker Modal */}
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
                filteredMaterials.slice(0, 20).map((item) => {
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
                        <p className="text-xs text-slate-500">ETB / pack</p>
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
