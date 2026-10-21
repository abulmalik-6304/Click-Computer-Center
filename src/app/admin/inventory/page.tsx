"use client";
import { useEffect, useMemo, useState } from "react";
import { toDriveImageUrl } from "@/lib/drive-url";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  unitCost: number;
  imageUrl?: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for new item
  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: "",
    minStock: "5",
    unitPrice: "",
    unitCost: "",
    imageUrl: "",
  });

  const fetchInventory = () => {
    setLoading(true);
    fetch("/api/sheets?name=Inventory")
      .then((r) => r.json())
      .then((d) => {
        const rawData = Array.isArray(d) ? d : [];
        const formatted: InventoryItem[] = rawData.map((item: any, index: number) => ({
          id: String(item.id || item.ID || item.Item_ID || index + 1),
          name: String(item.name || item.Item_Name || item.Product_Name || "Unknown Item"),
          category: String(item.category || item.Category || "General"),
          stock: Number(item.stock || item.Stock || item.Quantity || 0),
          minStock: Number(item.minStock || item.Min_Stock || 5),
          unitPrice: Number(item.unitPrice || item.Unit_Price || item.Price || 0),
          unitCost: Number(item.unitCost || item.Unit_Cost || item.Cost || 0),
          imageUrl: item.imageUrl || item.Image_Url || item.Image || "",
        }));
        setItems(formatted);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return ["all", ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQ =
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        item.category.toLowerCase().includes(q.toLowerCase()) ||
        item.id.toLowerCase().includes(q.toLowerCase());
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      return matchesQ && matchesCat;
    });
  }, [items, q, selectedCategory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ name: "", category: "", stock: "", minStock: "5", unitPrice: "", unitCost: "", imageUrl: "" });
        fetchInventory(); // Reload list
      } else {
        alert("Failed to add inventory item.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Live stock list synced directly from Google Sheets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          ➕ Add New Item
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input
          placeholder="Search product, category, ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              Category: {cat}
            </option>
          ))}
        </select>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(filtered, null, 2))}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 border border-slate-300"
        >
          📋 Copy Inventory JSON
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {["Item", "Category", "Stock Status", "Unit Cost", "Selling Price", "Profit Margin"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading stock data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No inventory items found.</td></tr>
            ) : (
              filtered.map((item) => {
                const profit = item.unitPrice - item.unitCost;
                const isLowStock = item.stock <= item.minStock && item.stock > 0;
                const isOutOfStock = item.stock <= 0;

                return (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={toDriveImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-lg">
                            💻
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{item.category}</td>
                    <td className="px-4 py-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Out of Stock ({item.stock})
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Low Stock ({item.stock})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          In Stock ({item.stock})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.unitCost.toFixed(2)} ETB</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.unitPrice.toFixed(2)} ETB</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">+{profit.toFixed(2)} ETB</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add New Inventory Item</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input required placeholder="e.g. Core i5 Laptop" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input placeholder="e.g. Laptops / Accessories" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock Qty</label>
                  <input required type="number" placeholder="10" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (ETB)</label>
                  <input required type="number" step="0.01" placeholder="45000" value={form.unitCost} onChange={(e) => setForm({...form, unitCost: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (ETB)</label>
                  <input required type="number" step="0.01" placeholder="55000" value={form.unitPrice} onChange={(e) => setForm({...form, unitPrice: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL (Google Drive or Direct)</label>
                <input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
