// src/components/employee/QuickSaleForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  price: number;        // selling price (fallback)
  sellingPrice: number; // ✅ from API
  costPrice: number;
  stock: number;
  image: string;
}

interface CartLine {
  itemId: string;
  itemName: string;
  sellingPrice: number; // ✅ API expects this
  quantity: number;
  subtotal: number;
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

export default function QuickSaleForm() {
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── Load inventory ───
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/inventory/refresh", {
          cache: "no-store",
        });
        const data = await res.json();
        const list = data.items || data.inventory || [];
        if (Array.isArray(list)) {
          // ✅ Normalize items
          setItems(
            list.map((i: any) => ({
              id: String(i.id || i.Item_ID || ""),
              name: String(i.name || i.Item_Name || ""),
              code: String(i.code || i.Item_Code || ""),
              price: Number(i.price || i.sellingPrice || 0),
              sellingPrice: Number(
                i.sellingPrice || i.price || i.Selling_Price || 0
              ),
              costPrice: Number(i.costPrice || i.Cost_Price || 0),
              stock: Number(i.stock || 0),
              image: String(i.image || ""),
            }))
          );
        }
      } catch (e) {
        console.error("Load inventory failed:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 24);
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [items, search]);

  // ─── Cart logic ───
  function addToCart(item: InventoryItem) {
    if (item.stock <= 0) {
      alert("❌ ከመጋዘን ውስጥ አልቋል!");
      return;
    }
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      if (existing.quantity + 1 > item.stock) {
        alert("❌ ከመጋዘን በላይ ማዘዝ አይቻልም!");
        return;
      }
      setCart(
        cart.map((c) =>
          c.itemId === item.id
            ? {
                ...c,
                quantity: c.quantity + 1,
                subtotal: (c.quantity + 1) * c.sellingPrice,
              }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          itemId: item.id,
          itemName: item.name,
          sellingPrice: item.sellingPrice || item.price,
          quantity: 1,
          subtotal: item.sellingPrice || item.price,
        },
      ]);
    }
  }

  function updateQuantity(itemId: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (item && qty > item.stock) {
      alert("❌ ከመጋዘን በላይ!");
      return;
    }
    setCart(
      cart.map((c) =>
        c.itemId === itemId
          ? { ...c, quantity: qty, subtotal: qty * c.sellingPrice }
          : c
      )
    );
  }

  function removeFromCart(itemId: string) {
    setCart(cart.filter((c) => c.itemId !== itemId));
  }

  const total = cart.reduce((s, c) => s + c.subtotal, 0);

  // ─── Submit ───
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("❌ ቢያንስ አንድ እቃ ይጨምሩ");
      return;
    }

    setSaving(true);
    try {
      // ✅ API payload — matches /api/sales/route.ts
      const payload = {
        customerName: customerName || "Walk-in",
        customerPhone,
        paymentMethod,
        discount: 0,
        paidAmount: total,     // ✅ fully paid
        saleStatus: "Completed",
        items: cart.map((c) => ({
          itemId: c.itemId,
          itemName: c.itemName,
          sellingPrice: c.sellingPrice, // ✅ API expects sellingPrice
          quantity: c.quantity,
        })),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "❌ ሽያጭ መመዝገብ አልተቻለም");
        setSaving(false);
        return;
      }

      setSuccess(
        `✅ ሽያጭ ተመዝግቧል! Sale #${data.salesId || ""}`
      );

      // Reset form
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("Cash");
      setNotes("");

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
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Left — Item picker */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search items by name or code…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          {loading ? (
            <p className="text-center py-8 text-slate-500">⏳ Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              No items found
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  disabled={item.stock <= 0}
                  className="p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-left transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">{item.code}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">
                    {fmt(item.sellingPrice || item.price)} ETB
                  </p>
                  <p className="text-xs text-slate-500">
                    Stock: {item.stock}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="space-y-4">
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 sticky top-4"
        >
          <h2 className="font-bold text-slate-900">🛒 Cart ({cart.length})</h2>

          {cart.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">
              Cart is empty
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cart.map((c) => (
                <div
                  key={c.itemId}
                  className="p-2 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900 flex-1">
                      {c.itemName}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(c.itemId)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(c.itemId, c.quantity - 1)
                        }
                        className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-xs"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={c.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            c.itemId,
                            Number(e.target.value) || 1
                          )
                        }
                        className="w-10 text-center rounded border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(c.itemId, c.quantity + 1)
                        }
                        className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-xs"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs font-bold text-emerald-600">
                      {fmt(c.subtotal)} ETB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {cart.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-800">
                  Total
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  {fmt(total)} ETB
                </span>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="👤 Customer name (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="📞 Phone (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Cash">💵 Cash</option>
              <option value="Telebirr">📱 Telebirr</option>
              <option value="CBE">🏦 CBE</option>
              <option value="Card">💳 Card</option>
              <option value="Credit">📝 Credit</option>
            </select>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="📝 Notes (optional)"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || cart.length === 0}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50"
          >
            {saving
              ? "⏳ Saving…"
              : `✅ Complete Sale · ${fmt(total)} ETB`}
          </button>
        </form>
      </div>
    </div>
  );
}
