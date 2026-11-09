// src/components/employee/QuickInventoryForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickInventoryForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("General");
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [unitType, setUnitType] = useState("pcs");
  const [packSize, setPackSize] = useState(1);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("❌ Item name is required");
      return;
    }
    if (costPrice <= 0) {
      setError("❌ Cost price must be > 0");
      return;
    }
    if (sellingPrice <= 0) {
      setError("❌ Selling price must be > 0");
      return;
    }
    if (sellingPrice < costPrice) {
      setError("❌ Selling price must be >= cost price");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: name,
          itemCode: code || undefined,
          category,
          costPrice,
          sellingPrice,
          stockQuantity: quantity,
          unitType,
          packSize,
          reorderLevel,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "❌ እቃ መመዝገብ አልተቻለም");
        setSaving(false);
        return;
      }

      setSuccess(`✅ እቃ ተመዝግቧል! (${data.id || ""})`);

      setTimeout(() => {
        router.push("/employee/dashboard");
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
    >
      {/* Item Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          📝 Item Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. HP Laptop Charger"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Code + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            🏷 Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Auto-generated if empty"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            📂 Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            💵 Cost Price (ETB) *
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={costPrice || ""}
            onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            💰 Selling Price (ETB) *
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={sellingPrice || ""}
            onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Quantity + Unit + Pack */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            🔢 Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            📦 Unit
          </label>
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="pcs">Pieces</option>
            <option value="kg">KG</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="ltr">Liter</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            📊 Pack Size
          </label>
          <input
            type="number"
            min={1}
            value={packSize}
            onChange={(e) => setPackSize(Number(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Reorder Level */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          ⚠️ Reorder Level
        </label>
        <input
          type="number"
          min={0}
          value={reorderLevel}
          onChange={(e) => setReorderLevel(Number(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Alert when stock falls below this level
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          📝 Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional notes…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm disabled:opacity-50"
      >
        {saving ? "⏳ Saving…" : "✅ Register Item"}
      </button>
    </form>
  );
}
