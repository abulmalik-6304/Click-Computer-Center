// src/app/api/download/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

const ORDERS_SHEET = "Digital_Orders_TBL";
const PRODUCTS_SHEET = "Digital_Products_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // ─── Validate order ───
    const ordersSheet = await getSheet(ORDERS_SHEET);
    const orderRows = await ordersSheet.getRows();
    const order = orderRows.find(
      (r) => String(r.get("Download_Token")) === token
    );

    if (!order) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const status = String(order.get("Status") || "").toLowerCase();
    if (status !== "approved") {
      return NextResponse.json(
        { error: "Order not approved" },
        { status: 403 }
      );
    }

    // ─── Check download limit ───
    const downloadCount = Number(order.get("Download_Count") || 0);
    const downloadLimit = Number(order.get("Download_Limit") || 0);

    if (downloadLimit > 0 && downloadCount >= downloadLimit) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 403 }
      );
    }

    // ─── Get product file URL ───
    const productId = String(order.get("Product_ID") || "");
    const productSheet = await getSheet(PRODUCTS_SHEET);
    const productRows = await productSheet.getRows();
    const product = productRows.find(
      (r) => String(r.get("Product_ID")) === productId
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const fileUrl = String(product.get("File_URL") || "");
    const productTitle = String(product.get("Title") || "download");

    if (!fileUrl) {
      return NextResponse.json({ error: "File missing" }, { status: 404 });
    }

    // ─── Increment download count ───
    order.set("Download_Count", downloadCount + 1);
    await order.save();

    // ─── Redirect to R2 URL ───
    // Use redirect (works for both browser + <a download>)
    return NextResponse.redirect(fileUrl, 302);
  } catch (e: any) {
    console.error("Download error:", e);
    return NextResponse.json(
      { error: e.message || "Download failed" },
      { status: 500 }
    );
  }
}
