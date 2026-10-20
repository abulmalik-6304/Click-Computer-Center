"use client";
import { useEffect, useMemo, useState } from "react";
import { formatDriveUrl } from "@/lib/drive-url";

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

  useEffect(() => {
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

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Live stock list synced directly from Google Sheets</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          Total Items: {filtered.length}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input
          placeholder="Search by product name, category, ID…"
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
          📋 Copy Inventory Data
        </button>
      </div>

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
                            src={formatDriveUrl(item.imageUrl)}
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
    </div>
  );
}
