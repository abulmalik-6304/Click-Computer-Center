"use client";

import { useMemo, useState } from "react";
import { InventoryItem } from "@/lib/data-mappers";
import { toDriveImageUrl } from "@/lib/drive-url";

type ModalMode = "add" | "edit" | "stock-in" | null;

export default function InventoryClient({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [active, setActive] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(lq) ||
          i.itemCode.toLowerCase().includes(lq) ||
          i.id.toLowerCase().includes(lq)
      );
    }
    if (filter === "low") out = out.filter((i) => i.stock <= i.reorderLevel && i.stock > 0);
    if (filter === "out") out = out.filter((i) => i.stock === 0);
    return out;
  }, [items, q, filter]);

  const stats = {
    total: items.length,
    low: items.filter((i) => i.stock <= i.reorderLevel && i.stock > 0).length,
    out: items.filter((i) => i.stock === 0).length,
    value: items.reduce((sum, i) => sum + i.stock * i.costPrice, 0),
  };

  async function refresh() {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    if (Array.isArray(data)) {
      const { mapInventoryRow } = await import("@/lib/data-mappers");
      setItems(
        data.map(mapInventoryRow).filter((i: InventoryItem) => i.status !== "Archived")
      );
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📦 Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} items · {stats.low} low stock · {stats.out} out of stock
          </p>
        </div>
        <button
          onClick={() => { setActive(null); setModal("add"); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition"
        >
          + Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.total} color="slate" />
        <StatCard label="Low Stock" value={stats.low} color="orange" />
        <StatCard label="Out of Stock" value={stats.out} color="red" />
        <StatCard
          label="Inventory Value"
          value={`${stats.value.toLocaleString()} ETB`}
          color="emerald"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, code, or ID…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All" : f === "low" ? "Low" : "Out"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Item</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Code</th>
                <th className="text-right px-4 py-3 font-semibold">Cost</th>
                <th className="text-right px-4 py-3 font-semibold">Sell</th>
                <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Margin</th>
                <th className="text-right px-4 py-3 font-semibold">Stock</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filtered.map((i) => {
                  const low = i.stock <= i.reorderLevel && i.stock > 0;
                  const out = i.stock === 0;
                  return (
                    <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={toDriveImageUrl(i.image)}
                            alt={i.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                            onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.png")}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{i.name}</p>
                            <p className="text-xs text-slate-500 md:hidden">{i.itemCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{i.itemCode}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{i.costPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{i.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`text-xs font-semibold ${i.profitMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {i.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            out ? "bg-red-100 text-red-700"
                              : low ? "bg-orange-100 text-orange-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {i.stock} {i.unitType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setActive(i); setModal("stock-in"); }}
                            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                            title="Stock In"
                          >
                            ➕
                          </button>
                          <button
                            onClick={() => { setActive(i); setModal("edit"); }}
                            className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Archive "${i.name}"?`)) return;
                              await fetch("/api/inventory", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: i.id }),
                              });
                              refresh();
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Archive"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal === "add" && (
        <ItemFormModal
          title="Add New Item"
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal === "edit" && active && (
        <ItemFormModal
          title={`Edit: ${active.name}`}
          item={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
      {modal === "stock-in" && active && (
        <StockInModal
          item={active}
          onClose={() => { setModal(null); setActive(null); }}
          onSaved={() => { setModal(null); setActive(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Small components ───

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls = {
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

function ItemFormModal({
  title, item, onClose, onSaved,
}: { title: string; item?: InventoryItem; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    itemCode: item?.itemCode ?? "",
    costPrice: item?.costPrice ?? 0,
    sellingPrice: item?.sellingPrice ?? 0,
    stock: item?.stock ?? 0,
    image: item?.image ?? "",
    unitType: item?.unitType ?? "pcs",
    packSize: item?.packSize ?? 1,
    supplierId: item?.supplierId ?? "",
    reorderLevel: item?.reorderLevel ?? 10,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = item ? "PUT" : "POST";
    const body = item ? { id: item.id, ...form } : form;
    const res = await fetch("/api/inventory", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert("Save failed");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <Field label="Item Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Item Code" value={form.itemCode} onChange={(v) => setForm({ ...form, itemCode: v })} />
          <Field label="Unit Type" value={form.unitType} onChange={(v) => setForm({ ...form, unitType: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cost Price (ETB)" type="number" value={form.costPrice} onChange={(v) => setForm({ ...form, costPrice: +v })} required />
          <Field label="Selling Price (ETB)" type="number" value={form.sellingPrice} onChange={(v) => setForm({ ...form, sellingPrice: +v })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: +v })} />
          <Field label="Reorder Level" type="number" value={form.reorderLevel} onChange={(v) => setForm({ ...form, reorderLevel: +v })} />
        </div>
        <Field label="Image URL (Google Drive)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} placeholder="https://drive.google.com/file/d/..." />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50">
            {saving ? "Saving…" : item ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockInModal({
  item, onClose, onSaved,
}: { item: InventoryItem; onClose: () => void; onSaved: () => void }) {
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(item.costPrice);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/inventory/stock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, quantity: qty, buyingPrice: price, note }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert("Stock-In failed");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">➕ Stock In</h2>
        <p className="text-sm text-slate-500">
          {item.name} — Current: <span className="font-semibold">{item.stock}</span> {item.unitType}
        </p>
        <Field label="Quantity In" type="number" value={qty} onChange={(v) => setQty(+v)} required />
        <Field label="Buying Price (ETB)" type="number" value={price} onChange={(v) => setPrice(+v)} required />
        <Field label="Note" value={note} onChange={setNote} placeholder="e.g. New shipment from Supplier X" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Add Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string; value: any; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}
