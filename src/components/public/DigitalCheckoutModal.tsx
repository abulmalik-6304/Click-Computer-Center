// src/components/public/DigitalCheckoutModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import ImageUploader from "@/components/shared/ImageUploader";
import { BUSINESS_INFO } from "@/lib/public-constants";
import { formatFileSize } from "@/lib/digital-product-types";
import { toDriveImageUrl as formatDriveUrl } from "@/lib/drive-url";

interface Props {
  product: any;
  onClose: () => void;
}

// Bot username only (without @ or https://t.me/), e.g. ClickComputerBot
const BOT_USERNAME = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "")
  .replace(/^@/, "")
  .replace(/^https?:\/\/t\.me\//i, "")
  .trim();

export default function DigitalCheckoutModal({ product, onClose }: Props) {
  const [step, setStep] = useState<"info" | "payment" | "done">("info");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbe" | "dashen">("telebirr");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  // Live order status states
  const [orderStatus, setOrderStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const autoDownloadedRef = useRef(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Poll order status automatically once submitted
  useEffect(() => {
    if (step !== "done" || !orderId) return;
    if (orderStatus === "approved" || orderStatus === "rejected") return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/public/digital-orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.telegramConnected) {
          setTelegramConnected(true);
        }

        if (data.status === "approved" && data.downloadUrl) {
          setOrderStatus("approved");
          setDownloadUrl(data.downloadUrl);

          if (!autoDownloadedRef.current) {
            autoDownloadedRef.current = true;
            window.location.href = data.downloadUrl;
          }
        } else if (data.status === "rejected") {
          setOrderStatus("rejected");
          setRejectNotes(data.notes || "");
        }
      } catch {
        // Ignore transient network errors during polling
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [step, orderId, orderStatus]);

  function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Name is required / እባክዎ ስምዎን ያስገቡ");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Phone is required / እባክዎ ስልክ ቁጥርዎን ያስገቡ");
      return;
    }
    setError("");
    setStep("payment");
  }

  async function submitPayment() {
    if (!paymentReference) {
      setError("Please upload payment screenshot / እባክዎ የክፍያ ስክሪን ሾት ይጫኑ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/public/digital-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          paymentMethod,
          paymentReference,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to submit order");
        setSaving(false);
        return;
      }
      setOrderId(data.orderId || "");
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Network error occurred");
      setSaving(false);
    }
  }

  const fileMetaText = [
    product.fileType ? String(product.fileType).toUpperCase() : "DIGITAL",
    product.fileSize > 0 ? formatFileSize(product.fileSize) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const formattedAmount = `${Number(product.price || 0).toLocaleString()} ETB`;

  const selectedAccountInfo = {
    telebirr: {
      title: "Telebirr / ቴሌብር",
      account: BUSINESS_INFO.payment.telebirr,
    },
    cbe: {
      title: "Commercial Bank of Ethiopia (CBE) / የኢትዮጵያ ንግድ ባንክ",
      account: BUSINESS_INFO.payment.cbe,
    },
    dashen: {
      title: "Dashen Bank / ዳሽን ባንክ",
      account: BUSINESS_INFO.payment.dashen,
    },
  }[paymentMethod];

  // Strictly targets the Telegram Bot (never a channel link)
  const botStartUrl = BOT_USERNAME
    ? `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(orderId)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">💳 Checkout</h2>
            <p className="text-xs text-emerald-100 truncate">{product.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white text-xl shrink-0"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Info */}
        {step === "info" && (
          <form onSubmit={goToPayment} className="p-5 space-y-3">
            {/* Product Preview */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              {product.thumbnailImage ? (
                <img
                  src={formatDriveUrl(product.thumbnailImage)}
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200 bg-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-2xl shrink-0">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {product.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{fileMetaText}</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">
                  {formattedAmount}
                </p>
              </div>
            </div>

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name / ስምዎ *"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Your phone / ስልክ ቁጥር *"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email (optional) / ኢሜይል (አማራጭ)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && <p className="text-xs text-red-600">❌ {error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
            >
              Continue to Payment →
            </button>
          </form>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && (
          <div className="p-5 space-y-4">
            {/* Amount in large green text */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-xs font-semibold text-emerald-800">
                📱 Send {formattedAmount} to: / የሚከፈለው መጠን፦
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1 tracking-tight">
                {formattedAmount}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Payment Method / የክፍያ አማራጭ *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "telebirr" | "cbe" | "dashen")
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="telebirr">Telebirr / ቴሌብር</option>
                <option value="cbe">CBE / የኢትዮጵያ ንግድ ባንክ</option>
                <option value="dashen">Dashen Bank / ዳሽን ባንክ</option>
              </select>
            </div>

            {/* Only the selected payment account is shown */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                {selectedAccountInfo.title}
              </p>
              <p className="text-sm font-mono font-bold text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all">
                {selectedAccountInfo.account}
              </p>
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                በመረጡት የክፍያ አማራጭ ክፍያዎን ይክፈሉና ስክሪን ሾት ይላኩልን።
                <br />
                <span className="text-slate-500">
                  Please pay using your selected method and upload the payment screenshot.
                </span>
              </p>
            </div>

            <ImageUploader
              value={paymentReference}
              onChange={setPaymentReference}
              folder="digital-orders/payments"
              label="📸 Payment Screenshot / የክፍያ ስክሪን ሾት *"
              accept="image"
              maxSizeMB={10}
            />

            {error && <p className="text-xs text-red-600">❌ {error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("info");
                }}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={submitPayment}
                disabled={saving || !paymentReference}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 transition"
              >
                {saving ? "Submitting…" : "Submit Order"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done & Live Delivery */}
        {step === "done" && (
          <div className="p-6 text-center space-y-3">
            {orderStatus === "approved" && downloadUrl ? (
              <>
                <div className="text-5xl">🎉</div>
                <h3 className="text-xl font-bold text-emerald-900">
                  ክፍያዎ ተረጋግጧል! / Payment Approved!
                </h3>
                <p className="text-sm text-slate-600">
                  ማውረድ በራሱ ተጀምሯል። ካልጀመረ ከታች ያለውን ቁልፍ ይጫኑ፦
                </p>
                <a
                  href={downloadUrl}
                  className="block w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  ⬇️ Download Now
                </a>
              </>
            ) : orderStatus === "rejected" ? (
              <>
                <div className="text-5xl">❌</div>
                <h3 className="text-xl font-bold text-red-900">
                  ትዕዛዝዎ አልጸደቀም / Order Rejected
                </h3>
                {rejectNotes && (
                  <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    Reason / ምክንያት: {rejectNotes}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl">⏳</div>
                <h3 className="text-xl font-bold text-slate-900">
                  ክፍያዎ በመረጋገጥ ላይ ነው… / Verifying Payment…
                </h3>
                <p className="text-sm text-slate-600">
                  Order ID: <strong>{orderId}</strong>
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                  <p>
                    ክፍያዎ እንደተረጋገጠ ፋይሉ በቀጥታ እንዲወርድ ወይም በቦታችን እንዲላክልዎ ከታች ያለውን በተን ይጫኑ።
                  </p>
                  <p className="text-amber-700">
                    Connect our Telegram Bot below so it sends your download link directly once approved.
                  </p>
                </div>

                {telegramConnected ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
                    ✅ Telegram Bot Connected! ክፍያዎ ሲጸድቅ ሊንኩን በቀጥታ በቴሌግራም ቦቱ እንልክልዎታለን።
                  </div>
                ) : botStartUrl ? (
                  <a
                    href={botStartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition"
                  >
                    🤖 Connect Telegram to Receive Link
                  </a>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    ⚠️ Telegram Bot username (`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`) is not configured yet.
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
