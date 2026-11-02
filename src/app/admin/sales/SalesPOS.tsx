// src/app/admin/sales/SalesPOS.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import NewCustomerModal from "@/components/admin/NewCustomerModal";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

// ═══════════════════════════════════════════════════════════════
// TYPES — 🔧 FIXED to match actual API data
// ═══════════════════════════════════════════════════════════════
interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  image: string;
  stock: number;
  sellingPrice: number;   // ✅ price → sellingPrice
  costPrice: number;       // ✅ አዲስ
  unitType: string;        // ✅ አዲስ
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
}

interface CartItem {
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
  cart: CartItem[];
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
}: {
  initialInventory: InventoryItem[];
  initialCustomers?: Customer[];
  userRole: string;
  userName: string;
}) {
  const router = useRouter();

  // ─── State ───
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [saleStatus, setSaleStatus] = useState<"Draft" | "Completed">("Completed");

  // Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const isOwnerOrManager = ["owner", "manager"].includes(userRole);

  // ─── Categories ───
  const categories = useMemo(() => {
    const cats = new Set(initialInventory.map((i) => i.category || "General"));
    return ["All", ...Array.from(cats)];
  }, [initialInventory]);

  // ─── Filtered products ───
  const filteredProducts = useMemo(() => {
    return initialInventory.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [initialInventory, search, selectedCategory]);

  // ─── Filtered customers ───
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const lq = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(lq) || c.phone.includes(customerSearch);
  });

  // ─── Calculations ───
  const subtotal = cart.reduce(
    (acc, item) => acc + item.sellingPrice * item.quantity,
    0
  );
  const totalAmount = Math.max(0, subtotal - Number(discount || 0));
  const paid = paidAmount === "" ? totalAmount : Number(paidAmount);

  // Payment status auto
  const paymentStatus =
    paid >= totalAmount ? "Paid" : paid > 0 ? "Partial" : "Unpaid";

  // ─── Cart actions ───
  function addToCart(item: InventoryItem) {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((i) =>
          i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
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
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.itemId === itemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > i.maxStock) return i;
            return { ...i, quantity: newQty };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function updatePrice(itemId: string, newPrice: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.itemId === itemId ? { ...i, sellingPrice: newPrice } : i
      )
    );
  }

  function removeFromCart(itemId: string) {
    // ✅ FIXED typo: removeFromCard → removeFromCart
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  function selectCustomer(c: Customer) {
    setCustomer(c);
    setCustomerSearch("");
    setShowCustomerList(false);
  }

  function handleCustomerCreated(newCustomer: Customer) {
    setCustomers([...customers, newCustomer]);
    setCustomer(newCustomer);
    setShowNewCustomer(false);
  }

  // ─── Checkout ───
  async function handleCheckout() {
    if (cart.length === 0) {
      setError("ካርቱ ባዶ ነው (Cart is empty)");
      return;
    }

    // Validate price floor
    for (const c of cart) {
      const floor = c.costPrice * 1.1;
      if (c.sellingPrice < floor) {
        setError(
          `❌ "${c.name}": ዝቅተኛ ዋጋ ${floor.toFixed(2)} ETB (cost + 10%)`
        );
        return;
      }
    }

    setLoading(true);
    setError("");

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
      if (!res.ok) {
        throw new Error(data.error || "ሽያጩን መመዝገብ አልተቻለም");
      }

      setReceipt({
        invoiceNo: data.invoiceNo,
        salesId: data.salesId,
        customerName: customer?.name || "Walk-in",
        customerPhone: customer?.phone || "",
        cart,
        subtotal,
        discount: Number(discount || 0),
        total: totalAmount,
        paid,
        paymentMethod,
        paymentStatus,
        saleStatus,
      });

      // Reset
      setCart([]);
      setDiscount(0);
      setPaidAmount("");
      setCustomer(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Receipt view ───
  if (receipt) {
    return (
      <ReceiptView
        data={receipt}
        onClose={() => {
          setReceipt(null);
          setSaleStatus("Completed");
        }}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ═══ LEFT: Product Catalog (2 cols) ═══ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-xl font-bold text-slate-900">
              🧾 Point of Sale (POS)
            </h1>

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 ዕቃዎችን በስም ወይም በኮድ ይፈልጉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-sm text-slate-900"
            />

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-orange-500 text-white shadow"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredProducts.map((item) => {
              const isOutOfStock = item.stock <= 0;
              return (
                <div
                  key={item.id}
                  onClick={() => !isOutOfStock && addToCart(item)}
                  className={`bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition ${
                    isOutOfStock
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-orange-500 cursor-pointer hover:shadow-md"
                  }`}
                >
                  {/* ✅ Image */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                    <img
                      src={formatDriveUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src = "/placeholder.svg")
                      }
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {item.code || "ITEM"}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isOutOfStock ? "Sold Out" : `${item.stock}`}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {item.name}
                    </h3>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-extrabold text-orange-600 text-sm">
                      {item.sellingPrice.toLocaleString()} ETB
                    </span>
                    <button
                      disabled={isOutOfStock}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition"
                    >
                      + አክል
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ RIGHT: Cart + Checkout ═══ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit sticky top-4">
          <div className="space-y-4">
            <h2 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
              🛒 ካርት ({cart.length})
            </h2>

            {/* Cart items */}
            {cart.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                ካርቱ ባዶ ነው
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
                {cart.map((item) => {
                  const floor = item.costPrice * 1.1;
                  const isBelowFloor = item.sellingPrice < floor;
                  return (
                    <div
                      key={item.itemId}
                      className={`pt-3 first:pt-0 ${
                        isBelowFloor ? "bg-red-50 -mx-2 px-2 py-2 rounded-lg" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <input
                              type="number"
                              value={item.sellingPrice}
                              onChange={(e) =>
                                updatePrice(item.itemId, Number(e.target.value))
                              }
                              className={`w-20 rounded border px-1 py-0.5 text-xs ${
                                isBelowFloor
                                  ? "border-red-500 text-red-700 bg-red-50"
                                  : "border-slate-300 text-slate-900"
                              }`}
                            />
                            <span className="text-xs text-slate-500">ETB</span>
                          </div>
                          {isBelowFloor && (
                            <p className="text-xs text-red-600 mt-0.5 font-semibold">
                              Min: {Math.round(floor)} ETB
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.itemId, -1)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.itemId, 1)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.itemId)}
                            className="text-red-500 hover:text-red-700 text-xs ml-1"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Customer section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  👤 ደንበኛ (Customer)
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                    {showCustomerList && (
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
                              <p className="font-medium text-slate-900">
                                {c.name}
                              </p>
                              <p className="text-xs text-slate-500">{c.phone}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          📞 {customer.phone || "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => setCustomer(null)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowNewCustomer(true)}
                  className="mt-2 w-full py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg"
                >
                  ➕ New Customer
                </button>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  💳 Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="Telebirr">Telebirr</option>
                  <option value="CBE">CBE</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {/* Discount + Paid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ቅናሽ
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    የተከፈለ
                  </label>
                  <input
                    type="number"
                    placeholder={totalAmount.toString()}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Sale status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📋 Sale Status
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setSaleStatus("Draft")}
                    className={`py-2 text-xs font-semibold rounded ${
                      saleStatus === "Draft"
                        ? "bg-amber-500 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    📝 Draft
                  </button>
                  <button
                    onClick={() => setSaleStatus("Completed")}
                    className={`py-2 text-xs font-semibold rounded ${
                      saleStatus === "Completed"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    ✅ Completed
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary + Checkout */}
          <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">
                {subtotal.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-slate-900">
              <span>Total:</span>
              <span className="text-orange-600">
                {totalAmount.toLocaleString()} ETB
              </span>
            </div>

            {/* Payment status badge */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Payment:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  paymentStatus === "Paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : paymentStatus === "Partial"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {paymentStatus}
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className={`w-full py-3 text-white font-bold rounded-xl disabled:opacity-50 transition ${
                saleStatus === "Draft"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading
                ? "⏳ Processing…"
                : saleStatus === "Draft"
                ? `📝 Save Draft · ${totalAmount.toLocaleString()} ETB`
                : `✅ Complete Sale · ${totalAmount.toLocaleString()} ETB`}
            </button>
          </div>
        </div>
      </div>

      {/* New customer modal */}
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
// RECEIPT VIEW
// ═══════════════════════════════════════════════════════════════
function ReceiptView({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

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
        <p class="right small">${data.paymentMethod} · ${data.paymentStatus}</p>
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

  async function copyReceipt() {
    const text = `
🧾 *CLICK COMPUTER CENTER*
───────────────────────
📄 Invoice: ${data.invoiceNo}
📅 Date: ${new Date().toLocaleDateString()}
👤 Customer: ${data.customerName}
${data.customerPhone ? `📞 Phone: ${data.customerPhone}` : ""}
📋 Status: ${data.saleStatus}
💳 Payment: ${data.paymentMethod} (${data.paymentStatus})
───────────────────────
${data.cart.map((c) => `• ${c.name} × ${c.quantity} = ${(c.sellingPrice * c.quantity).toLocaleString()} ETB`).join("\n")}
───────────────────────
Subtotal: ${data.subtotal.toLocaleString()} ETB
Discount: ${data.discount.toLocaleString()} ETB
*TOTAL: ${data.total.toLocaleString()} ETB*
Paid: ${data.paid.toLocaleString()} ETB
───────────────────────
🙏 Thank you!
    `.trim();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-3">
        <div className="text-center border-b border-slate-200 pb-3">
          <div className="text-5xl mb-2">
            {data.saleStatus === "Draft" ? "📝" : "✅"}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {data.saleStatus === "Draft" ? "Draft Saved" : "Sale Complete!"}
          </h2>
          <p className="text-sm text-slate-500">Click Computer Center</p>
        </div>

        <div className="text-sm space-y-1">
          <Row label="Invoice" value={data.invoiceNo} />
          <Row label="Customer" value={data.customerName} />
          <Row label="Status" value={data.saleStatus} />
        </div>

        <div className="border-t border-slate-200 pt-2 space-y-1 text-sm max-h-40 overflow-y-auto">
          {data.cart.map((c) => (
            <div key={c.itemId} className="flex justify-between">
              <span className="truncate text-slate-700">
                {c.name} × {c.quantity}
              </span>
              <span className="font-medium">
                {(c.sellingPrice * c.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-2 space-y-1 text-sm">
          <Row label="Subtotal" value={`${data.subtotal.toLocaleString()} ETB`} />
          <Row label="Discount" value={`${data.discount.toLocaleString()} ETB`} />
          <Row label="Total" value={`${data.total.toLocaleString()} ETB`} bold />
          <Row label="Paid" value={`${data.paid.toLocaleString()} ETB`} />
          <Row
            label="Payment"
            value={`${data.paymentMethod} (${data.paymentStatus})`}
          />
        </div>

        {data.saleStatus === "Completed" && (
          <div className="grid grid-cols-2 gap-2 pt-2">
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
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold"
        >
          {data.saleStatus === "Draft" ? "Done" : "New Sale"}
        </button>
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
