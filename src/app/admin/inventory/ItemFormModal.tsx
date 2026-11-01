// src/app/admin/inventory/ItemFormModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UNIT_TYPES, CATEGORY_OPTIONS } from "@/lib/inventory-helpers";
import { InventoryItem } from "./page";

type Mode = "add" | "edit" | "stock-in";

export default function ItemFormModal({
  mode,
  item,
  onClose,
  onSaved,
}: {
  mode: Mode;
  item?: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Add/Edit fields
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    itemCode: item?.code || "",
    name: item?.name || "",
    image: item?.image || "",
    costPrice: item?.costPrice || 0,
    sellingPrice: item?.sellingPrice || 0,
    unitType: item?.unitType || "pcs",
    category: item?.category || "Other",
    supplierId: item?.supplierId || "",
    reorderLevel: item?.reorderLevel || 10,
  });

  // Stock-In fields
  const [stockIn, setStockIn] = useState({
    quantity: 0,
    buyingPrice: item?.costPrice || 0,
    note: "",
  });

  // Suppliers
  const [suppliers, setSuppliers] = useState<
    { id: string; name: string; company: string; supplyItem: string }[]
  >([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetch("/api/suppliers/list");
        const d = await res.json();
        if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
      } catch {
        /* ignore */
      }
    }
    if (mode !== "stock-in") loadSuppliers();
  }, [mode]);

  const filteredSuppliers = useMemo(() => {
    const lq = supplierSearch.toLowerCase().trim();
    if (!lq) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(lq) ||
        s.company.toLowerCase().includes(lq) ||
        s.id.toLowerCase().includes(lq)
    );
  }, [suppliers, supplierSearch]);

  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId);

  function handleScanCode() {
    codeInputRef.current?.focus();
    alert("📷 Ready to scan barcode — place barcode near scanner or type code");
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim()) {
      setError("Item name is required");
      return;
    }
    if (form.sellingPrice <= 0) {
      setError("Selling price must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      // Log activity
      try {
        await fetch("/api/inventory/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            itemId: data.itemId,
            itemName: form.name,
            details: `New item created`,
            newValue: `Name: ${form.name}, Price: ${form.sellingPrice}`,
          }),
        });
      } catch {
        /* ignore */
      }

      setSuccess("✅ Item added successfully!");
      setTimeout(() => onSaved(), 800);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item?.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      // Log activity
      try {
        await fetch("/api/inventory/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "edit",
            itemId: item?.id,
            itemName: form.name,
            details: `Item edited`,
            oldValue: `Price: ${item?.sellingPrice}, Stock: ${item?.stock}`,
            newValue: `Price: ${form.sellingPrice}, Name: ${form.name}`,
          }),
        });
      } catch {
        /* ignore */
      }

      setSuccess("✅ Item updated!");
      setTimeout(() => onSaved(), 800);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  async function submitStockIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (stockIn.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item?.id,
          quantity: stockIn.quantity,
          buyingPrice: stockIn.buyingPrice,
          note: stockIn.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to stock-in");
        setSaving(false);
        return;
      }

      // Log activity
      try {
        await fetch("/api/inventory/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "stock-in",
            itemId: item?.id,
            itemName: item?.name,
            details: `Added ${stockIn.quantity} ${item?.unitType}`,
            newValue: `Stock: ${data.newStock}, Avg Cost: ${data.newAvg}`,
          }),
        });
      } catch {
        /* ignore */
      }

      setSuccess(`✅ Added ${stockIn.quantity} to stock!`);
      setTimeout(() => onSaved(), 800);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  const title =
    mode === "add"
      ? "➕ Add New Item"
      : mode === "edit"
      ? "✏️ Edit Item"
      : "📥 Stock-In";

  // Computed for stock-in preview
  const newStock = (item?.stock || 0) + stockIn.quantity;
  const newAvgCost =
    item && newStock > 0 && stockIn.buyingPrice > 0
      ? Math.round(
          ((item.stock * item.avgCost + stockIn.quantity * stockIn.buyingPrice) /
            newStock) *
            100
        ) / 100
      : item?.avgCost || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={
          mode === "add"
            ? submitAdd
            : mode === "edit"
            ? submitEdit
            : submitStockIn
        }
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ─── ADD / EDIT MODE ─── */}
          {(mode === "add" || mode === "edit") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Code
                  </label>
                  <div className="flex gap-1">
                    <input
                      ref={codeInputRef}
                      type="text"
                      value={form.itemCode}
                      onChange={(e) =>
                        setForm({ ...form, itemCode: e.target.value })
                      }
                      placeholder="Scan or type code"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleScanCode}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                      title="Scan barcode"
                    >
                      📷
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Dell Latitude E7450"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Image (Google Drive URL)
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (ETB)
                  </label>
                  <input
                    type="number"
                    value={form.costPrice || ""}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: Number(e.target.value) })
                    }
                    min={0}
                    step={0.01}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (ETB) *
                  </label>
                  <input
                    type="number"
                    value={form.sellingPrice || ""}
                    onChange={(e) =>
                      setForm({ ...form, sellingPrice: Number(e.target.value) })
                    }
                    required
                    min={0}
                    step={0.01}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Type
                  </label>
                  <select
                    value={form.unitType}
                    onChange={(e) =>
                      setForm({ ...form, unitType: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {UNIT_TYPES.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      selectedSupplier
                        ? `${selectedSupplier.name} — ${selectedSupplier.company}`
                        : supplierSearch
                    }
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setForm({ ...form, supplierId: "" });
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    placeholder="🔍 Search supplier…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  {selectedSupplier && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, supplierId: "" });
                        setSupplierSearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                    >
                      ✕
                    </button>
                  )}
                  {showSupplierDropdown && !selectedSupplier && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                      {filteredSuppliers.length === 0 ? (
                        <p className="p-3 text-xs text-slate-500 text-center">
                          No suppliers found
                        </p>
                      ) : (
                        filteredSuppliers.slice(0, 10).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, supplierId: s.id });
                              setSupplierSearch("");
                              setShowSupplierDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 text-sm"
                          >
                            <p className="font-medium text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.company}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reorder Level (alert when stock ≤ this)
                </label>
                <input
                  type="number"
                  value={form.reorderLevel || ""}
                  onChange={(e) =>
                    setForm({ ...form, reorderLevel: Number(e.target.value) })
                  }
                  min={0}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              {mode === "edit" && item && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-sm">
                  <p className="font-semibold text-slate-700 text-xs mb-2">
                    🔒 Read-Only Info
                  </p>
                  <InfoRow label="Item ID" value={item.id} />
                  <InfoRow label="Current Stock" value={String(item.stock)} />
                  <InfoRow
                    label="Avg Cost"
                    value={`${item.avgCost?.toLocaleString?.() ?? "0"} ETB`}
                  />
                  <InfoRow
                    label="Stock Status"
                    value={item.stock > item.reorderLevel ? "✅ In Stock" : "⚠️ Low"}
                  />
                </div>
              )}
            </>
          )}

          {/* ─── STOCK-IN MODE ─── */}
          {mode === "stock-in" && item && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-semibold text-blue-900">📦 {item.name}</p>
                <p className="text-xs text-blue-700">
                  Current: {item.stock} {item.unitType} · Avg Cost:{" "}
                  {item.avgCost.toLocaleString()} ETB
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity In *
                  </label>
                  <input
                    type="number"
                    value={stockIn.quantity || ""}
                    onChange={(e) =>
                      setStockIn({
                        ...stockIn,
                        quantity: Number(e.target.value),
                      })
                    }
                    required
                    min={1}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buying Price (per unit)
                  </label>
                  <input
                    type="number"
                    value={stockIn.buyingPrice || ""}
                    onChange={(e) =>
                      setStockIn({
                        ...stockIn,
                        buyingPrice: Number(e.target.value),
                      })
                    }
                    min={0}
                    step={0.01}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note (optional)
                </label>
                <textarea
                  value={stockIn.note}
                  onChange={(e) =>
                    setStockIn({ ...stockIn, note: e.target.value })
                  }
                  placeholder="e.g. From supplier X, invoice #123"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              {/* Preview */}
              {stockIn.quantity > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-sm">
                  <p className="font-semibold text-emerald-900 text-xs mb-1">
                    📊 Preview After Stock-In
                  </p>
                  <InfoRow
                    label="New Stock"
                    value={`${newStock} ${item.unitType}`}
                  />
                  <InfoRow
                    label="New Avg Cost"
                    value={`${newAvgCost.toLocaleString()} ETB`}
                  />
                  <InfoRow
                    label="Total Purchase Value"
                    value={`${(
                      stockIn.quantity * stockIn.buyingPrice
                    ).toLocaleString()} ETB`}
                  />
                </div>
              )}
            </>
          )}

          {/* Success / Error */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex gap-2">
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
            className={`flex-1 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50 ${
              mode === "stock-in"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {saving
              ? "Saving…"
              : mode === "add"
              ? "Add Item"
              : mode === "edit"
              ? "Save Changes"
              : "Add Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
