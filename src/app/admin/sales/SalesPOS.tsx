"use client";

import { useMemo, useState } from "react";

type CartItem = { itemId: string; name: string; price: number; qty: number; maxStock: number };

export default function SalesPOS({
  inventory,
  recentSales,
}: {
  inventory: any[];
  recentSales: any[];
}) {
  const [tab, setTab] = useState<"pos" | "history">("pos");

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🧾 Sales / POS</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inventory.length} items available · {recentSales.length} recent sales
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab("pos")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "pos" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}`}
          >
            🛒 New Sale
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "history" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}`}
          >
            📜 History
          </button>
        </div>
      </div>

      {tab === "pos" ? <POS inventory={inventory} /> : <History sales={recentSales} />}
    </div>
  );
}

function POS({ inventory }: { inventory: any[] }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const filteredInv = useMemo(() => {
    if (!q) return inventory;
    const lq = q.toLowerCase();
    return inventory.filter(
      (i) => String(i.Item_Name ?? "").toLowerCase().includes(lq) || String(i.Item_Code ?? "").toLowerCase().includes(lq)
    );
  }, [inventory, q]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const paid = paidAmount ?? total;

  function addToCart(item: any) {
    const id = item.Item_ID;
    const existing = cart.find((c) => c.itemId === id);
    const maxStock = Number(item.Stock_Quantity ?? 0);
    if (existing) {
      if (existing.qty >= maxStock) return;
      setCart(cart.map((c) => c.itemId === id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        itemId: id,
        name: item.Item_Name,
        price: Number(item.Selling_Price ?? 0),
        qty: 1,
        maxStock,
      }]);
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.itemId !== id));
      return;
    }
    setCart(cart.map((c) => c.itemId === id ? { ...c, qty: Math.min(qty, c.maxStock) } : c));
  }

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customer || "Walk-in",
        paymentMethod,
        discount,
        paidAmount: paid,
        items: cart.map((c) => ({ itemId: c.itemId, quantity: c.qty })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setReceipt({ ...data, cart, customer, subtotal, discount, total, paid });
      setCart([]);
      setCustomer("");
      setDiscount(0);
      setPaidAmount(null);
    } else {
      alert(`Sale failed: ${data.error}`);
    }
  }

  if (receipt) {
    return <ReceiptView data={receipt} onClose={() => { setReceipt(null); window.location.reload(); }} />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Product Grid */}
      <div className="lg:col-span-2 space-y-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search products…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
          {filteredInv.map((item) => {
            const stock = Number(item.Stock_Quantity ?? 0);
            return (
              <button
                key={item.Item_ID}
                onClick={() => addToCart(item)}
                disabled={stock === 0}
                className="text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <p className="font-semibold text-sm text-slate-900 truncate">{item.Item_Name}</p>
                <p className="text-xs text-slate-500 truncate">{item.Item_Code}</p>
                <p className="mt-2 text-lg font-bold text-emerald-600">
                  {Number(item.Selling_Price ?? 0).toLocaleString()} ETB
                </p>
                <p className="text-xs text-slate-400">Stock: {stock}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-fit sticky top-4">
        <h2 className="font-bold text-slate-900 mb-3">🛒 Cart ({cart.length})</h2>

        <div className="flex-1 space-y-2 max-h-64 overflow-y-auto mb-3">
          {cart.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Cart is empty</p>
          ) : (
            cart.map((c) => (
              <div key={c.itemId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.price.toLocaleString()} ETB</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(c.itemId, c.qty - 1)} className="w-6 h-6 bg-slate-200 rounded text-slate-700 text-xs">−</button>
                  <span className="text-sm font-semibold w-6 text-center">{c.qty}</span>
                  <button onClick={() => updateQty(c.itemId, c.qty + 1)} className="w-6 h-6 bg-slate-200 rounded text-slate-700 text-xs">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100">
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            <option>Cash</option>
            <option>Telebirr</option>
            <option>CBE Birr</option>
            <option>Bank Transfer</option>
            <option>Card</option>
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500">Discount</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500">Paid</label>
              <input type="number" value={paid} onChange={(e) => setPaidAmount(+e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">{subtotal.toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-emerald-600">{total.toLocaleString()} ETB</span>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0 || submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
          >
            {submitting ? "Processing…" : `Checkout · ${total.toLocaleString()} ETB`}
          </button>
        </div>
      </div>
    </div>
  );
}

function History({ sales }: { sales: any[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Invoice</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Customer</th>
              <th className="text-right px-4 py-3 font-semibold">Total</th>
              <th className="text-right px-4 py-3 font-semibold">Paid</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500">No sales yet</td></tr>
            ) : (
              sales.map((s) => (
                <tr key={s.Sales_ID} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{s.Invoice_No || s.Sales_ID}</td>
                  <td className="px-4 py-3 text-slate-600">{String(s.Date).slice(0, 10)}</td>
                  <td className="px-4 py-3">{s.Customer_Name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(s.Total_Amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{Number(s.Paid_Amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.Payment_Status === "Paid" ? "bg-emerald-100 text-emerald-700"
                        : s.Payment_Status === "Partial" ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }`}>{s.Payment_Status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceiptView({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-3">
        <div className="text-center border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">✅ Sale Complete</h2>
          <p className="text-sm text-slate-500">Click Computer Center</p>
        </div>
        <div className="text-sm space-y-1">
          <Row label="Invoice" value={data.invoiceNo} />
          <Row label="Customer" value={data.customer || "Walk-in"} />
          <Row label="Date" value={new Date().toLocaleString()} />
        </div>
        <div className="border-t border-slate-200 pt-2 space-y-1 text-sm">
          {data.cart.map((c: any) => (
            <div key={c.itemId} className="flex justify-between">
              <span>{c.name} × {c.qty}</span>
              <span>{(c.price * c.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-2 space-y-1 text-sm">
          <Row label="Subtotal" value={`${data.subtotal.toLocaleString()} ETB`} />
          <Row label="Discount" value={`${data.discount.toLocaleString()} ETB`} />
          <Row label="Total" value={`${data.total.toLocaleString()} ETB`} bold />
          <Row label="Paid" value={`${data.paid.toLocaleString()} ETB`} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => window.print()} className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium">🖨 Print</button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold">Done</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-900"}>{value}</span>
    </div>
  );
}
