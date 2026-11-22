// src/app/download/[token]/page.tsx
import { getSheet } from "@/lib/google-sheets";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const ORDERS_SHEET = "Digital_Orders_TBL";
const PRODUCTS_SHEET = "Digital_Products_TBL";

async function getDownloadData(token: string) {
  try {
    const ordersSheet = await getSheet(ORDERS_SHEET);
    const orderRows = await ordersSheet.getRows();
    const order = orderRows.find(
      (r) => String(r.get("Download_Token")) === token
    );

    if (!order) return null;

    const orderStatus = String(order.get("Status") || "").toLowerCase();
    if (orderStatus !== "approved") {
      return {
        valid: false,
        reason:
          orderStatus === "pending"
            ? "Your order is still being verified. Please wait."
            : "This order was rejected.",
        order: {
          id: String(order.get("Order_ID") || ""),
          customerName: String(order.get("Customer_Name") || ""),
        },
      };
    }

    const productSheet = await getSheet(PRODUCTS_SHEET);
    const productRows = await productSheet.getRows();
    const product = productRows.find(
      (r) => String(r.get("Product_ID")) === String(order.get("Product_ID"))
    );

    if (!product) return null;

    const downloadCount = Number(order.get("Download_Count") || 0);
    const downloadLimit = Number(order.get("Download_Limit") || 0);

    if (downloadLimit > 0 && downloadCount >= downloadLimit) {
      return {
        valid: false,
        reason: `Download limit reached (${downloadCount}/${downloadLimit}).`,
        order: {
          id: String(order.get("Order_ID") || ""),
          customerName: String(order.get("Customer_Name") || ""),
        },
      };
    }

    return {
      valid: true,
      order: {
        id: String(order.get("Order_ID") || ""),
        customerName: String(order.get("Customer_Name") || ""),
        downloadCount,
        downloadLimit,
        token,
      },
      product: {
        title: String(product.get("Title") || ""),
        fileUrl: String(product.get("File_URL") || ""),
        fileType: String(product.get("File_Type") || ""),
        fileSize: Number(product.get("File_Size") || 0),
      },
    };
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getDownloadData(token);

  if (!data) notFound();

  // Invalid state
  if (!data.valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900">
            Download Unavailable
          </h1>
          <p className="text-slate-600">{data.reason}</p>
          {data.order?.customerName && (
            <p className="text-sm text-slate-500">
              Order: <strong>{data.order.id}</strong>
            </p>
          )}
          <div className="pt-2 space-y-2">
            <Link
              href="/store/digital"
              className="block w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              ← Back to Store
            </Link>
            <Link
              href="/contact"
              className="block w-full py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
            >
              📞 Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Valid — show download button
  const remaining = data.order.downloadLimit
    ? data.order.downloadLimit - data.order.downloadCount
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-slate-900">
            Your Download is Ready!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thank you, {data.order.customerName}!
          </p>
        </div>

        {/* Product */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-xs text-emerald-700 uppercase tracking-wide">
            Your Product
          </p>
          <h2 className="font-bold text-slate-900 mt-1">
            {data.product.title}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {data.product.fileType?.toUpperCase() || "FILE"} ·{" "}
            {formatFileSize(data.product.fileSize)}
          </p>
        </div>

        {/* Download info */}
        <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
          <p>
            <span className="text-slate-500">Order:</span>{" "}
            <strong>{data.order.id}</strong>
          </p>
          {remaining !== null && (
            <p>
              <span className="text-slate-500">Downloads remaining:</span>{" "}
              <strong className="text-emerald-600">{remaining}</strong>
            </p>
          )}
        </div>

        {/* Download button */}
        <a
          href={`/api/download/${token}`}
          className="block w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-lg transition"
          download
        >
          ⬇️ Download Now
        </a>

        <p className="text-xs text-slate-500 text-center">
          Having issues? Contact us on{" "}
          <a
            href="https://t.me/rizqmarket1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Telegram
          </a>
        </p>
      </div>
    </div>
  );
}
