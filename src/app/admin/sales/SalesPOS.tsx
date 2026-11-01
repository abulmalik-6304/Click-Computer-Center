// src/app/admin/sales/SalesPOS.tsx
"use client";

import { useState } from "react";
import SalesHistory from "./SalesHistory";
import NewCustomerModal from "@/components/admin/NewCustomerModal";
import SalesActivityPanel from "@/components/admin/sales/SalesActivityPanel";
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
  const [inventory, setInventory] = useState(initialInventory);
  const [customers, setCustomers] = useState(initialCustomers);
  const [recentSales, setRecentSales] = useState(initialRecentSales);
  const [showPOS, setShowPOS] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const isOwnerOrManager = ["owner", "manager"].includes(userRole);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🧾 Sales</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inventory.length} items available · {recentSales.length} recent
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwnerOrManager && (
            <button
              onClick={() => setShowActivity((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition ${
                showActivity
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              📝 Activity Log
            </button>
          )}
          <button
            onClick={() => setShowPOS(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
          >
            🛒 New Sale
          </button>
        </div>
      </div>

      {showActivity && isOwnerOrManager && <SalesActivityPanel />}

      <SalesHistory userRole={userRole} />

      {showPOS && (
        <POSModal
          inventory={inventory}
          customers={customers}
          userRole={userRole}
          onCustomerAdded={refreshCustomers}
          onSaleCompleted={() => {
            refreshInventory();
            setShowPOS(false);
          }}
          onClose={() => setShowPOS(false)}
        />
      )}
    </div>
  );
}

// ─── POS Modal ───
function POSModal({
  inventory,
  customers,
  userRole,
  onCustomerAdded,
  onSaleCompleted,
  onClose,
}: {
  inventory: any[];
  customers: Customer[];
  userRole: string;
  onCustomerAdded: () => void;
  onSaleCompleted: () => void;
  onClose: () => void;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [saleStatus, setSaleStatus] = useState<"Draft" | "Completed">("Completed");

  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const lq = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(lq) || c.phone.includes(customerSearch);
  });

  const filteredItems = inventory.filter((i) => {
    if (!itemSearch) return true;
    const lq = itemSearch.toLowerCase();
    return (
      String(i.name).toLowerCase().includes(lq) ||
      String(i.code).toLowerCase().includes(lq)
    );
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
    setItemSearch("");
    setShowItemDropdown(false);
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

  async function checkout() {
    if (cart.length === 0) return;

    for (const c of cart) {
      const floor = c.costPrice * 1.1;
      if (c.sellingPrice < floor) {
        alert(`❌ ${c.name}: minimum price is ${floor.toFixed(2)} ETB`);
        return;
      }
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

      try {
        await fetch("/api/sales/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: saleStatus === "Draft" ? "draft" : "completed",
            salesId: data.salesId,
            invoiceNo: data.invoiceNo,
            customerName: customer?.name || "Walk-in",
            details: `${cart.length} items, ${total.toLocaleString()} ETB`,
          }),
        });
      } catch {
        /* ignore */
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
    } catch (e: any) {
      setSubmitting(false);
      alert(`❌ ${e.message}`);
    }
  }

  if (receipt) {
    return (
      <ReceiptView
        data={receipt}
        onClose={() => {
          setReceipt(null);
          onSaleCompleted();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">🛒 New Sale</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 grid lg:grid-cols-2 gap-4">
          {/* LEFT: Search + Cart */}
          <div className="space-y-3">
            {/* Item search */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                🔍 Search & Add Item
              </label>
              <div className="relative">
                <input
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  placeholder="Search by name or code…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
                {showItemDropdown && itemSearch && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                    {filteredItems.length === 0 ? (
                      <p className="p-3 text-xs text-slate-500 text-center">
                        No items found
                      </p>
                    ) : (
                      filteredItems.slice(0, 10).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="w-full text-left p-2 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2"
                        >
                          <img
                            src={formatDriveUrl(item.image)}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover bg-slate-100 flex-shrink-0"
                            onError={(e) =>
                              ((e.target as HTMLImageElement).src =
                                "/placeholder.svg")
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
                          <p className="text-sm font-bold text-emerald-600">
                            {item.sellingPrice.toLocaleString()}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                🛒 Cart ({cart.length})
              </h3>
              {cart.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No items yet — search above to add
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cart.map((c) => (
                    <div
                      key={c.itemId}
                      className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
                    >
                      <img
                        src={formatDriveUrl(c.image)}
                        alt={c.name}
                        className="w-10 h-10 rounded object-cover bg-slate-100 flex-shrink-0"
                        onError={(e) =>
                          ((e.target as HTMLImageElement).src = "/placeholder.svg")
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            value={c.sellingPrice}
                            onChange={(e) =>
                              updatePrice(c.itemId, Number(e.target.value))
                            }
                            className="w-20 rounded border border-slate-300 px-1 py-0.5 text-xs text-slate-900"
                          />
                          <span className="text-xs text-slate-500">ETB</span>
                          <span className="text-xs text-slate-400 ml-1">
                            (min {Math.round(c.costPrice * 1.1)})
                          </span>
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
                          <span className="text-xs text-slate-500 ml-auto">
                            = {(c.sellingPrice * c.quantity).toLocaleString()} ETB
                          </span>
                          <button
                            onClick={() => updateQty(c.itemId, 0)}
                            className="ml-1 w-6 h-6 bg-red-100 text-red-700 rounded text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Customer + Payment */}
          <div className="space-y-3">
            {/* Customer */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <label className="text-xs font-semibold text-slate-700">
                👤 Customer
              </label>
              <div className="flex gap-1 mt-1">
                <div className="flex-1 relative">
                  <input
                    value={
                      customer
                        ? `${customer.name} (${customer.phone})`
                        : customerSearch
                    }
                    onChange={(e) => {
                      setCustomer(null);
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search customer…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  {showCustomerDropdown && !customer && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                      {filteredCustomers.length === 0 ? (
                        <p className="p-3 text-xs text-slate-500 text-center">
                          No customers
                        </p>
                      ) : (
                        filteredCustomers.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
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
                <button
                  onClick={() => setShowNewCustomer(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                💳 Payment
              </label>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Discount</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(+e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Paid</label>
                  <input
                    type="number"
                    value={paid}
                    onChange={(e) => setPaidAmount(+e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Sale status */}
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
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
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-medium">-{discount.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1 border-t border-slate-200">
                <span>Total</span>
                <span className="text-emerald-600">{total.toLocaleString()} ETB</span>
              </div>
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
    </div>
  );
}

// ─── Receipt ───
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
