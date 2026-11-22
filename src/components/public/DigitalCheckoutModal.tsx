// src/components/public/DigitalCheckoutModal.tsx
"use client";

import { useState } from "react";
import ImageUploader from "@/components/shared/ImageUploader";
import { BUSINESS_INFO } from "@/lib/public-constants";

interface Props {
  product: any;
  onClose: () => void;
}

export default function DigitalCheckoutModal({ product, onClose }: Props) {
  const [step, setStep] = useState<"info" | "payment" | "done">("info");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("telebirr");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) { setError("Name is required"); return; }
    if (!customerPhone.trim()) { setError("Phone is required"); return; }
    setError("");
    setStep("payment");
  }

  async function submitPayment() {
    if (!paymentReference) { setError("Please upload payment screenshot"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/public/digital-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerName, customerPhone, customerEmail,
          paymentMethod, paymentReference,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
      setOrderId(data.orderId);
      setStep("done");
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">💳 Checkout</h2>
            <p className="text-xs text-emerald-100">{product.title}</p>
          </div>
          <button onClick={onClose} className="text-emerald-100 hover:text-white text-xl">✕</button>
        </div>

        {/* Step 1: Info */}
        {step === "info" && (
          <form onSubmit={goToPayment} className="p-5 space-y-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-xs text-slate-600">Total Price</p>
              <p className="text-2xl font-bold text-emerald-700">{Number(product.price).toLocaleString()} ETB</p>
            </div>

            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name *" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Your phone *" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />

            {error && <p className="text-xs text-red-600">❌ {error}</p>}

            <button type="submit" className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Continue to Payment →</button>
          </form>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && (
          <div className="p-5 space-y-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-800 mb-2">📱 Send payment to:</p>
              <div className="space-y-1 text-xs">
                <p><strong>Telebirr:</strong> {BUSINESS_INFO.payment.telebirr}</p>
                <p><strong>CBE:</strong> {BUSINESS_INFO.payment.cbe}</p>
                <p><strong>Dashen:</strong> {BUSINESS_INFO.payment.dashen}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Payment Method *</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                <option value="telebirr">Telebirr</option>
                <option value="cbe">CBE</option>
                <option value="dashen">Dashen Bank</option>
              </select>
            </div>

            <ImageUploader value={paymentReference} onChange={setPaymentReference} folder="digital-orders/payments" label="📸 Payment Screenshot *" accept="image" maxSizeMB={5} />

            {error && <p className="text-xs text-red-600">❌ {error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setStep("info")} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">← Back</button>
              <button onClick={submitPayment} disabled={saving || !paymentReference} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50">
                {saving ? "Submitting…" : "Submit Order"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="p-8 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h3 className="text-xl font-bold text-emerald-900">Order Submitted!</h3>
            <p className="text-sm text-slate-600">Order ID: <strong>{orderId}</strong></p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">⏳ We'll verify your payment within 1-2 hours. Download link will be sent via WhatsApp / Telegram.</div>
            <a href={BUSINESS_INFO.telegram} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">✈️ Contact us on Telegram</a>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
