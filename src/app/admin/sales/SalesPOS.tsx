// src/app/admin/sales/SalesPOS.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import NewCustomerModal from "@/components/admin/NewCustomerModal";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

// ═══════════════════════════════════════════════════════════════
// ✅ SAFE NUMBER FORMATTING — prevents null.toLocaleString() errors
// ═══════════════════════════════════════════════════════════════
function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num) ? "0" : num.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  image: string;
  stock: number;
  sellingPrice: number;
  costPrice: number;
  unitType: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
}

interface CartLine {
  itemId: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  maxStock: number;
  image: string;
}

interface ReceiptData {
  invoiceNo: string;
  salesId: string;
  customerName: string;
  customerPhone: string;
  cart: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  paymentMethod: string;
  paymentStatus: string;
  saleStatus: string;
}

export default function SalesPOS({
  initialInventory,
  initialCustomers = [],
  userRole,
  userName,
  initialRecentSales = [],
  initialPreselectedItemId = "",
  initialAutoOpen = false,
  canViewActivity = false,
  canVoid = false,
  canRefund = false,
  canDelete = false,
}: {
  initialInventory: InventoryItem[];
  initialCustomers?: Customer[];
  userRole: string;
  userName: string;
  initialRecentSales?: any[];
  initialPreselectedItemId?: string;
  initialAutoOpen?: boolean;
  canViewActivity?: boolean;
  canVoid?: boolean;
  canRefund?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  // ...
  // ✅ Auto-open POS if item is preselected OR autoOpen flag is set
  const [showPOS, setShowPOS] = useState(
    !!initialPreselectedItemId || initialAutoOpen
  );
  const [showActivity, setShowActivity] = useState(false);
  const [recentRefresh, setRecentRefresh] = useState(0);

  // ✅ Clean URL params after auto-open
  useEffect(() => {
    if (initialAutoOpen && initialPreselectedItemId) {
      // Clear the query params without reload
      window.history.replaceState({}, "", "/admin/sales");
    }
  }, [initialAutoOpen, initialPreselectedItemId]);

  // ✅ Only owner OR managers with explicit permission see Activity Log
  const canSeeActivity = canViewActivity;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🧾 Sales</h1>
          <p className="text-sm text-slate-500 mt-1">
            {initialInventory.length} items available
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSeeActivity && (
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md"
          >
            🛒 New Sale
          </button>
        </div>
      </div>

      {showActivity && canSeeActivity && <SalesActivityPanel />}

      <SalesHistoryPlaceholder
        refreshKey={recentRefresh}
        userRole={userRole}
      />

      {showPOS && (
        <POSModal
          inventory={initialInventory}
          customers={initialCustomers}
          userRole={userRole}
          preselectedItemId={initialPreselectedItemId}
          onClose={() => setShowPOS(false)}
          onSaleCompleted={() => {
            setShowPOS(false);
            setRecentRefresh((v) => v + 1);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PLACEHOLDER — import existing components
// ═══════════════════════════════════════════════════════════════
import SalesHistory from "./SalesHistory";
import SalesActivityPanel from "@/components/admin/sales/SalesActivityPanel";

function SalesHistoryPlaceholder({
  refreshKey,
  userRole,
}: {
  refreshKey: number;
  userRole: string;
}) {
  return <SalesHistory key={refreshKey} userRole={userRole} />;
}

// ═══════════════════════════════════════════════════════════════
// POS MODAL — Portrait, 4 Steps
// ═══════════════════════════════════════════════════════════════
function POSModal({
  inventory,
  customers,
  userRole,
  preselectedItemId = "",
  onClose,
  onSaleCompleted,
}: {
  inventory: InventoryItem[];
  customers: Customer[];
  userRole: string;
  preselectedItemId?: string;
  onClose: () => void;
  onSaleCompleted: () => void;
}) {
  const router = useRouter();

  // ─── STATE ───
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid" | "Partial">("Paid");
  const [saleStatus, setSaleStatus] = useState<"Draft" | "Completed">("Completed");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // ✅ AUTO-ADD preselected item to cart on mount
  useEffect(() => {
    if (!preselectedItemId) return;
    const item = inventory.find((i) => i.id === preselectedItemId);
    if (!item) return;
    if (item.stock <= 0) return;
    setCart((prev) => {
      // Skip if already in cart
      if (prev.find((c) => c.itemId === item.id)) return prev;
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          sellingPrice: item.sellingPrice,
          costPrice: item.costPrice,
          quantity: 1,
          maxStock: item.stock,
          image: item.image,
        },
      ];
    });
  }, [preselectedItemId, inventory]);

  // ─── CALCULATIONS ───
  const subtotal = cart.reduce((s, c) => s + c.sellingPrice * c.quantity, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const paid = paidAmount === "" ? total : Number(paidAmount);

  // Auto payment status
  const computedPaymentStatus: "Paid" | "Unpaid" | "Partial" =
    paid >= total && total > 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid";

  // Auto invoice number (preview)
  const invoicePreview = useMemo(() => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `INV-${year}-${random}`;
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  // ─── FILTERED LISTS ───
  const filteredCustomers = customerList.filter((c) => {
    if (!customerSearch) return true;
    const lq = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(lq) || c.phone.includes(customerSearch);
  });

  // ✅ ALWAYS show ALL items (including 0 stock)
  // Only filter when search has text
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return inventory;
    const lq = itemSearch.toLowerCase().trim();
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(lq) ||
        i.code.toLowerCase().includes(lq) ||
        (i.category && i.category.toLowerCase().includes(lq))
    );
  }, [inventory, itemSearch]);

  // ─── HANDLERS ───
  function selectCustomer(c: Customer) {
    setCustomer(c);
    setCustomerSearch("");
    setShowCustomerList(false);
  }

  function handleCustomerCreated(newCustomer: Customer) {
    setCustomerList([...customerList, newCustomer]);
    setCustomer(newCustomer);
    setShowNewCustomer(false);
  }

  function addToCart(item: InventoryItem) {
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      if (existing.quantity >= existing.maxStock) {
        alert(`Only ${existing.maxStock} in stock`);
        return;
      }
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
          image: item.image,
        },
      ]);
    }
    setShowItemPicker(false);
    setItemSearch("");
  }

  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.itemId !== itemId));
      return;
    }
    setCart(
      cart.map((c) => {
        if (c.itemId === itemId) {
          if (qty > c.maxStock) {
            alert(`Only ${c.maxStock} in stock`);
            return c;
          }
          return { ...c, quantity: qty };
        }
        return c;
      })
    );
  }

  function updatePrice(itemId: string, price: number) {
    setCart(cart.map((c) => (c.itemId === itemId ? { ...c, sellingPrice: price } : c)));
  }

  function removeLine(itemId: string) {
    setCart(cart.filter((c) => c.itemId !== itemId));
  }

  function handleDiscountChange(v: number) {
    setDiscount(v);
    // Re-compute payment status
    const newTotal = Math.max(0, subtotal - v);
    const newPaid = paidAmount === "" ? newTotal : Number(paidAmount);
    setPaymentStatus(
      newPaid >= newTotal && newTotal > 0
        ? "Paid"
        : newPaid > 0
        ? "Partial"
        : "Unpaid"
    );
  }

  function handlePaidChange(v: string) {
    setPaidAmount(v);
    const numVal = v === "" ? total : Number(v);
    setPaymentStatus(
      numVal >= total && total > 0 ? "Paid" : numVal > 0 ? "Partial" : "Unpaid"
    );
  }

  // ─── SUBMIT ───
  async function handleSubmit() {
    setError("");
    setSuccessMsg("");

    if (cart.length === 0) {
      setError("❌ ካርቱ ባዶ ነው — እባክዎ እቃ ይጨምሩ");
      return;
    }

    // Validate price floor
    for (const c of cart) {
      const floor = c.costPrice * 1.1;
      if (c.sellingPrice < floor) {
        setError(`❌ "${c.name}": ዝቅተኛ ዋጋ ${floor.toFixed(2)} ETB (cost + 10%)`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer?.name || "Walk-in",
          customerId: customer?.id || "",
          customerPhone: customer?.phone || "",
          paymentMethod,
          discount: Number(discount || 0),
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
      if (!res.ok) throw new Error(data.error || "ሽያጩን መመዝገብ አልተቻለም");

      // Log activity
      try {
        await fetch("/api/sales/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: saleStatus === "Draft" ? "draft" : "completed",
            salesId: data.salesId,
            invoiceNo: data.invoiceNo,
            customerName: customer?.name || "Walk-in",
            details: `${cart.length} items, ${fmt(total)} ETB`,
          }),
        });
      } catch {
        /* ignore */
      }

      const receiptData: ReceiptData = {
        invoiceNo: data.invoiceNo || invoicePreview,
        salesId: data.salesId,
        customerName: customer?.name || "Walk-in",
        customerPhone: customer?.phone || "",
        cart,
        subtotal,
        discount: Number(discount || 0),
        total,
        paid,
        paymentMethod,
        paymentStatus: computedPaymentStatus,
        saleStatus,
      };

      if (saleStatus === "Draft") {
        // Draft → just show success message
        setSuccessMsg("✅ ሽያጩ በተሳካ ሁኔታ ተቀምጧል (Draft)");
        setTimeout(() => {
          onSaleCompleted();
        }, 1500);
      } else {
        // Completed → show receipt popup
        setReceipt(receiptData);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── RECEIPT VIEW ───
  if (receipt) {
    return (
      <ReceiptPopup
        data={receipt}
        onClose={() => {
          setReceipt(null);
          onSaleCompleted();
        }}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — Portrait Modal
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[96vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">🛒 New Sale</h2>
            <p className="text-xs text-slate-500">
              {cart.length} items · {fmt(total)} ETB
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* Body — 4 Steps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ═══ STEP 1: INVOICE + DATE + CUSTOMER ═══ */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                1
              </span>
              Invoice & Customer
            </h3>

            {/* Invoice + Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Invoice No</label>
                <input
                  type="text"
                  value={invoicePreview}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Date</label>
                <input
                  type="date"
                  value={today}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Customer */}
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Customer Name
              </label>
              {!customer ? (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerList(true);
                    }}
                    onFocus={() => setShowCustomerList(true)}
                    placeholder="🔍 Search customer…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  {showCustomerList && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-30">
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
              ) : (
                <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{customer.name}</p>
                    <p className="text-xs text-slate-600">📞 {customer.phone || "—"}</p>
                  </div>
                  <button
                    onClick={() => setCustomer(null)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    ✕
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowNewCustomer(true)}
                className="mt-2 w-full py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg"
              >
                ➕ Add New Customer
              </button>
            </div>

            {/* Phone (auto) */}
            <div>
              <label className="text-xs font-semibold text-slate-600">Phone Number</label>
              <input
                type="tel"
                value={customer?.phone || ""}
                readOnly
                placeholder="Auto-filled"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </section>

          {/* ═══ STEP 2: ITEMS TABLE ═══ */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Items
              </h3>
              <button
                onClick={() => setShowItemPicker(true)}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg"
              >
                ➕ New Item
              </button>
            </div>

            {/* Items table */}
            {cart.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm text-slate-500">No items yet</p>
                <p className="text-xs text-slate-400">Click "New Item" above to add</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold w-8">No</th>
                      <th className="px-2 py-2 text-left font-semibold">Item Name</th>
                      <th className="px-2 py-2 text-right font-semibold">Price</th>
                      <th className="px-2 py-2 text-center font-semibold w-20">Qty</th>
                      <th className="px-2 py-2 text-right font-semibold">Total</th>
                      <th className="px-1 py-2 w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((line, idx) => {
                      const floor = line.costPrice * 1.1;
                      const isBelow = line.sellingPrice < floor;
                      return (
                        <tr
                          key={line.itemId}
                          className={`border-t border-slate-100 ${
                            isBelow ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="px-2 py-2 text-slate-500">{idx + 1}</td>
                          <td className="px-2 py-2">
                            <p className="font-medium text-slate-900 truncate max-w-[120px]">
                              {line.name}
                            </p>
                            {isBelow && (
                              <p className="text-xs text-red-600 font-semibold">
                                Min: {Math.round(floor)} ETB
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              value={line.sellingPrice}
                              onChange={(e) =>
                                updatePrice(line.itemId, Number(e.target.value))
                              }
                              className={`w-16 rounded border px-1 py-0.5 text-xs text-right ${
                                isBelow
                                  ? "border-red-500 text-red-700"
                                  : "border-slate-300 text-slate-900"
                              }`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => updateQty(line.itemId, line.quantity - 1)}
                                className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-xs font-bold"
                              >
                                −
                              </button>
                              <span className="text-xs font-semibold w-6 text-center">
                                {line.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(line.itemId, line.quantity + 1)}
                                className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right font-semibold text-slate-900">
                            {fmt(line.sellingPrice * line.quantity)}
                          </td>
                          <td className="px-1 py-2">
                            <button
                              onClick={() => removeLine(line.itemId)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ═══ STEP 3: TOTAL + DISCOUNT + PAID ═══ */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                3
              </span>
              Totals
            </h3>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-semibold text-slate-900">
                {fmt(subtotal)} ETB
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Discount</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Paid Amount</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => handlePaidChange(e.target.value)}
                  placeholder={String(total)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span className="text-emerald-600">{fmt(total)} ETB</span>
            </div>
          </section>

          {/* ═══ STEP 4: PAYMENT METHOD + STATUS + SALE STATUS ═══ */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                4
              </span>
              Payment & Status
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600">Payment Method</label>
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
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Payment Status</label>
              <select
                value={computedPaymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "Paid" | "Unpaid" | "Partial")
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value="Paid">✅ Paid</option>
                <option value="Partial">🟡 Partial</option>
                <option value="Unpaid">🔴 Unpaid</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Auto-calculated from Paid Amount
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Sales Status</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setSaleStatus("Draft")}
                  className={`py-2 text-xs font-semibold rounded-lg ${
                    saleStatus === "Draft"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  📝 Draft
                </button>
                <button
                  onClick={() => setSaleStatus("Completed")}
                  className={`py-2 text-xs font-semibold rounded-lg ${
                    saleStatus === "Completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  ✅ Completed
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {saleStatus === "Draft"
                  ? "📝 Saves without receipt popup"
                  : "✅ Opens receipt popup automatically"}
              </p>
            </div>
          </section>

          {/* Feedback */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">{successMsg}</p>
            </div>
          )}
        </div>

        {/* Footer — Submit */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading || cart.length === 0}
            className={`w-full py-3 text-white font-bold rounded-xl disabled:opacity-50 transition shadow-sm ${
              saleStatus === "Draft"
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading
              ? "⏳ Processing…"
              : saleStatus === "Draft"
              ? `📝 Save Draft · ${fmt(total)} ETB`
              : `✅ Complete Sale · ${fmt(total)} ETB`}
          </button>
        </div>
      </div>

      {/* Item Picker Modal */}
      {showItemPicker && (
        <ItemPickerModal
          items={filteredItems}
          search={itemSearch}
          onSearchChange={setItemSearch}
          onSelect={addToCart}
          onClose={() => {
            setShowItemPicker(false);
            setItemSearch("");
          }}
        />
      )}

      {/* New Customer Modal */}
      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ITEM PICKER MODAL
// ═══════════════════════════════════════════════════════════════
function ItemPickerModal({
  items,
  search,
  onSearchChange,
  onSelect,
  onClose,
}: {
  items: InventoryItem[];
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (item: InventoryItem) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">📦 Select Item</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-3 border-b border-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Search by name, code, or category…"
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No items found</p>
          ) : (
            items.map((item) => {
              const out = item.stock <= 0;
              return (
                <button
                  key={item.id}
                  onClick={() => !out && onSelect(item)}
                  disabled={out}
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
                      {fmt(item.sellingPrice)}
                    </p>
                    <p className="text-xs text-slate-500">ETB</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECEIPT POPUP
// ═══════════════════════════════════════════════════════════════
function ReceiptPopup({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function buildReceiptText(): string {
    const items = data.cart
      .map(
        (c) =>
          `  ${c.name} × ${c.quantity} = ${fmt(c.sellingPrice * c.quantity)} ETB`
      )
      .join("\n");
    return [
      "🧾 CLICK COMPUTER CENTER",
      "───────────────────────",
      `Invoice: ${data.invoiceNo}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Customer: ${data.customerName}`,
      data.customerPhone ? `Phone: ${data.customerPhone}` : "",
      "───────────────────────",
      "ITEMS:",
      items,
      "───────────────────────",
      `Subtotal: ${fmt(data.subtotal)} ETB`,
      data.discount > 0
        ? `Discount: -${fmt(data.discount)} ETB`
        : "",
      `TOTAL: ${fmt(data.total)} ETB`,
      `Paid: ${fmt(data.paid)} ETB`,
      `Payment: ${data.paymentMethod} (${data.paymentStatus})`,
      "───────────────────────",
      "Thank you!",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function copyReceipt() {
    const text = buildReceiptText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function shareReceipt() {
    const text = buildReceiptText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${data.invoiceNo}`,
          text,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyReceipt();
      alert("Share not supported — copied to clipboard.");
    }
  }

  function printReceipt() {
    const html = `
      <html><head><title>Receipt ${data.invoiceNo}</title>
      <style>
        body{font-family:Arial;padding:20px;max-width:400px;margin:0 auto;color:#0f172a}
        h1{font-size:18px;margin:0 0 4px}
        .small{font-size:12px;color:#666}
        hr{border:none;border-top:1px dashed #999;margin:8px 0}
        table{width:100%;font-size:13px;border-collapse:collapse}
        td{padding:4px 0}
        .right{text-align:right}
        .total{font-weight:bold;font-size:15px}
      </style></head><body>
        <h1>CLICK COMPUTER CENTER</h1>
        <p class="small">Ethiopia</p>
        <hr/>
        <p><strong>Invoice:</strong> ${data.invoiceNo}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ""}
        <p><strong>Status:</strong> ${data.saleStatus}</p>
        <hr/>
        <table>
          <thead><tr><td><strong>Item</strong></td><td class="right"><strong>Qty</strong></td><td class="right"><strong>Price</strong></td></tr></thead>
          <tbody>
            ${data.cart
              .map(
                (c) =>
                  `<tr><td>${c.name}</td><td class="right">${c.quantity}</td><td class="right">${fmt(c.sellingPrice * c.quantity)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <hr/>
        <p class="right">Subtotal: ${fmt(data.subtotal)} ETB</p>
        <p class="right">Discount: ${fmt(data.discount)} ETB</p>
        <p class="total right">TOTAL: ${fmt(data.total)} ETB</p>
        <p class="right">Paid: ${fmt(data.paid)} ETB</p>
        <p class="right small">${data.paymentMethod} · ${data.paymentStatus}</p>
        <hr/>
        <p class="small right">Thank you! Come again.</p>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=500,height=700");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-3">
        <div className="text-center border-b border-slate-200 pb-3">
          <div className="text-5xl mb-2">✅</div>
          <h2 className="text-xl font-bold text-slate-900">Sale Complete!</h2>
          <p className="text-sm text-slate-500">{data.invoiceNo}</p>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Customer:</span>
            <span className="font-medium text-slate-900">{data.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Items:</span>
            <span className="font-medium text-slate-900">{data.cart.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total:</span>
            <span className="font-bold text-emerald-600">
              {fmt(data.total)} ETB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Paid:</span>
            <span className="font-medium text-slate-900">
              {fmt(data.paid)} ETB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={printReceipt}
            className="py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm"
          >
            🖨 Print
          </button>
          <button
            onClick={copyReceipt}
            className={`py-2.5 rounded-lg font-semibold text-sm ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {copied ? "✅ Copied" : "📋 Copy"}
          </button>
          <button
            onClick={shareReceipt}
            className="py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm"
          >
            🔗 Share
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
        >
          ✓ Done
        </button>

        <p className="text-xs text-slate-400 text-center">
          Receipt can also be printed later from Sales History
        </p>
      </div>
    </div>
  );
}
