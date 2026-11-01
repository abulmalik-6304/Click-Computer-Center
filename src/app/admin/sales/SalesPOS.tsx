// src/app/admin/sales/SalesPOS.tsx
"use client";

import { useState } from "react";
import SalesHistory from "./SalesHistory";
import NewCustomerModal from "@/components/admin/NewCustomerModal";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
}

interface Sale {
  salesId: string;
  date: string;
  customerName: string;
  staffName: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  invoiceNo: string;
  saleStatus: string;
  items: any[];
}

type Tab = "pos" | "history";

interface CartLine {
  itemId: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  maxStock: number;
  unitType: string;
  image: string;
}

export default function SalesPOS({
  initialInventory,
  initialCustomers,
  initialRecentSales,
  userRole,
  userName,
}: {
  initialInventory: any[];
  initialCustomers: Customer[];
  initialRecentSales: Sale[];
  userRole: string;
  userName: string;
}) {
  const [tab, setTab] = useState<Tab>("pos");
  const [inventory, setInventory] = useState(initialInventory);
  const [customers, setCustomers] = useState(initialCustomers);
  const [recentSales, setRecentSales] = useState(initialRecentSales);

  async function refreshInventory() {
    try {
      const res = await fetch("/api/inventory/refresh", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setInventory(
          data.items.filter((i: any) => i.stock > 0 && i.sellingPrice > 0)
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function refreshCustomers() {
    try {
      const res = await fetch("/api/customers/list");
      const data = await res.json();
      if (Array.isArray(data.customers)) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🧾 Sales</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inventory.length} items · {recentSales.length} recent
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab("pos")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === "pos" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
            }`}
          >
            🛒 New Sale
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === "history" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
            }`}
          >
            📜 History
          </button>
        </div>
      </div>

      {tab === "pos" ? (
        <POS
          inventory={inventory}
          customers={customers}
          userRole={userRole}
          onCustomerAdded={refreshCustomers}
          onSaleCompleted={refreshInventory}
        />
      ) : (
        <SalesHistory userRole={userRole} />
      )}
    </div>
  );
}

// ─── POS ───
function POS({
  inventory,
  customers,
  userRole,
  onCustomerAdded,
  onSaleCompleted,
}: {
  inventory: any[];
  customers: Customer[];
  userRole: string;
  onCustomerAdded: () => void;
  onSaleCompleted: () => void;
}) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [saleStatus, setSaleStatus] = useState<"Draft" | "Completed">("Completed");

  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const isOwnerOrManager = ["owner", "manager"].includes(userRole);

  const filteredInv = inventory.filter((i) => {
    if (!q) return true;
    const lq = q.toLowerCase();
    return (
      String(i.name).toLowerCase().includes(lq) ||
      String(i.code).toLowerCase().includes(lq)
    );
  });

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const lq = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(lq) || c.phone.includes(customerSearch);
  });

  const subtotal = cart.reduce((s, c) => s + c.sellingPrice * c.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const paid = paidAmount ?? total;

  function addToCart(item: any) {
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      if (existing.quantity >= existing.maxStock) return;
      setCart(
        cart.map((c) =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          itemId: item.id,
          name: item.name,
          sellingPrice: item.sellingPrice,
          costPrice: item.costPrice,
          quantity: 1,
          maxStock: item.stock,
          unitType: item.unitType,
          image: item.image,
        },
      ]);
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.itemId !== id));
      return;
    }
    setCart(
      cart.map((c) =>
        c.itemId === id ? { ...c, quantity: Math.min(qty, c.maxStock) } : c
      )
    );
  }

  function updatePrice(id: string, price: number) {
    setCart(cart.map((c) => (c.itemId === id ? { ...c, sellingPrice: price } : c)));
  }

  function selectCustomer(c: Customer) {
    setCustomer(c);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  }

  function handleCustomerCreated(newCustomer: Customer) {
    onCustomerAdded();
    setCustomer(newCustomer);
    setShowNewCustomer(false);
  }

  function validatePrices(): string | null {
    for (const c of cart) {
      const floor = c.costPrice * 1.1;
      if (c.sellingPrice < floor) {
        return `${c.name}: minimum price is ${floor.toFixed(2)} ETB (cost + 10%)`;
      }
    }
    return null;
  }

  async function checkout() {
    if (cart.length === 0) return;

    const priceError = validatePrices();
    if (priceError) {
      alert(`❌ ${priceError}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer?.name || "Walk-in",
          customerId: customer?.id || "",
          customerPhone: customer?.phone || "",
          paymentMethod,
          discount,
          paidAmount: paid,
          saleStatus,
          items: cart.map((c) => ({
            itemId: c.itemId,
            quantity: c.quantity,
            sellingPrice: c.sellingPrice,
            costPerItem: c.costPrice,
          })),
        }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        alert(`❌ Sale failed: ${data.error}`);
        return;
      }

      setReceipt({
        ...data,
        cart,
        customer,
        subtotal,
        discount,
        total,
        paid,
        paymentMethod,
        saleStatus,
      });

      setCart([]);
      setCustomer(null);
      setDiscount(0);
      setPaidAmount(null);
      setSaleStatus("Completed");

      onSaleCompleted();
    } catch (e: any) {
      setSubmitting(false);
      alert(`❌ ${e.message}`);
    }
  }

  if (receipt) {
    return <ReceiptView data={receipt} onClose={() => setReceipt(null)} />;
  }

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Products */}
        <div className="lg:col-span-2 space-y-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search products…"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
            {filteredInv.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={item.stock === 0}
                className="text-left p-2 bg-white rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition disabled:opacity-40"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2">
                  <img
                    src={formatDriveUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "/placeholder.svg")
                    }
                  />
                </div>
                <p className="font-semibold text-xs text-slate-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.code}</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">
                  {item.sellingPrice.toLocaleString()} ETB
                </p>
                <p className="text-xs text-slate-400">Stock: {item.stock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-fit sticky top-4">
          <h2 className="font-bold text-slate-900 mb-3">🛒 Cart ({cart.length})</h2>

          <div className="flex-1 space-y-2 max-h-64 overflow-y-auto mb-3">
            {cart.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Cart is empty</p>
            ) : (
              cart.map((c) => (
                <div
                  key={c.itemId}
                  className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {c.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={c.sellingPrice}
                        onChange={(e) => updatePrice(c.itemId, Number(e.target.value))}
                        className="w-20 rounded border border-slate-300 px-1 py-0.5 text-xs text-slate-900"
                      />
                      <span className="text-xs text-slate-500">ETB</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => updateQty(c.itemId, c.quantity - 1)}
                        className="w-6 h-6 bg-slate-200 rounded text-slate-700 text-xs"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(c.itemId, c.quantity + 1)}
                        className="w-6 h-6 bg-slate-200 rounded text-slate-700 text-xs"
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateQty(c.itemId, 0)}
                        className="ml-auto w-6 h-6 bg-red-100 text-red-700 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            {/* Customer */}
            <div className="relative">
              <label className="text-xs text-slate-500">Customer</label>
              <div className="flex gap-1">
                <input
                  value={
                    customer ? `${customer.name} (${customer.phone})` : customerSearch
                  }
                  onChange={(e) => {
                    setCustomer(null);
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search or select customer…"
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                  title="Add new customer"
                >
                  + New
                </button>
              </div>
              {showCustomerDropdown && !customer && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                  {filteredCustomers.length === 0 ? (
                    <p className="p-3 text-xs text-slate-500 text-center">
                      No customers
                    </p>
                  ) : (
                    filteredCustomers.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 text-sm"
                      >
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option>Cash</option>
              <option>Telebirr</option>
              <option>CBE</option>
              <option>Credit</option>
            </select>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500">Discount</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(+e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500">Paid</label>
                <input
                  type="number"
                  value={paid}
                  onChange={(e) => setPaidAmount(+e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Sale Status */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSaleStatus("Draft")}
                className={`flex-1 py-1.5 text-xs font-medium rounded ${
                  saleStatus === "Draft"
                    ? "bg-amber-500 text-white"
                    : "text-slate-600"
                }`}
              >
                📝 Draft
              </button>
              <button
                type="button"
                onClick={() => setSaleStatus("Completed")}
                className={`flex-1 py-1.5 text-xs font-medium rounded ${
                  saleStatus === "Completed"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600"
                }`}
              >
                ✅ Completed
              </button>
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
              className={`w-full py-3 text-white font-semibold rounded-lg disabled:opacity-50 transition ${
                saleStatus === "Draft"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {submitting
                ? "Processing…"
                : saleStatus === "Draft"
                ? `Save Draft · ${total.toLocaleString()} ETB`
                : `Checkout · ${total.toLocaleString()} ETB`}
            </button>
          </div>
        </div>
      </div>

      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={handleCustomerCreated}
        />
      )}
    </>
  );
}

// ─── Receipt View ───
function ReceiptView({ data, onClose }: { data: any; onClose: () => void }) {
  function printReceipt() {
    const html = `
      <html><head><title>Receipt ${data.invoiceNo}</title>
      <style>
        body{font-family:Arial;padding:20px;max-width:400px;margin:0 auto}
        h1{font-size:18px;margin:0 0 4px}
        .small{font-size:12px;color:#666}
        hr{border:none;border-top:1px solid #ddd;margin:8px 0}
        table{width:100%;font-size:13px;border-collapse:collapse}
        td{padding:4px 0}
        .right{text-align:right}
        .total{font-weight:bold;font-size:15px}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Ethiopia</p><hr/>
        <p><strong>Invoice:</strong> ${data.invoiceNo}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Customer:</strong> ${data.customer?.name || "Walk-in"}</p>
        <p><strong>Status:</strong> ${data.saleStatus}</p>
        <hr/>
        <table>
          <thead><tr><td><strong>Item</strong></td><td class="right"><strong>Qty</strong></td><td class="right"><strong>Price</strong></td></tr></thead>
          <tbody>
            ${data.cart
              .map(
                (c: any) =>
                  `<tr><td>${c.name}</td><td class="right">${c.quantity}</td><td class="right">${(c.sellingPrice * c.quantity).toLocaleString()}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <hr/>
        <p class="right">Subtotal: ${data.subtotal.toLocaleString()} ETB</p>
        <p class="right">Discount: ${data.discount.toLocaleString()} ETB</p>
        <p class="total right">TOTAL: ${data.total.toLocaleString()} ETB</p>
        <p class="right">Paid: ${data.paid.toLocaleString()} ETB</p>
        <p class="right small">${data.paymentMethod}</p>
        <hr/>
        <p class="small right">Thank you!</p>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=500,height=700");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-3">
        <div className="text-center border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">
            {data.saleStatus === "Draft" ? "📝 Draft Saved" : "✅ Sale Complete"}
          </h2>
          <p className="text-sm text-slate-500">Click Computer Center</p>
        </div>
        <div className="text-sm space-y-1">
          <Row label="Invoice" value={data.invoiceNo} />
          <Row label="Customer" value={data.customer?.name || "Walk-in"} />
          <Row label="Status" value={data.saleStatus} />
        </div>
        <div className="border-t border-slate-200 pt-2 space-y-1 text-sm max-h-40 overflow-y-auto">
          {data.cart.map((c: any) => (
            <div key={c.itemId} className="flex justify-between">
              <span className="truncate">
                {c.name} × {c.quantity}
              </span>
              <span>{(c.sellingPrice * c.quantity).toLocaleString()}</span>
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
          {data.saleStatus === "Completed" && (
            <button
              onClick={printReceipt}
              className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
            >
              🖨 Print
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-900"}>
        {value}
      </span>
    </div>
  );
}
