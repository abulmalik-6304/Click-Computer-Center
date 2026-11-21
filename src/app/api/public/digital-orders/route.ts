// src/app/api/public/digital-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheet, getDoc } from "@/lib/google-sheets";

const ORDERS_SHEET = "Digital_Orders_TBL";
const PRODUCTS_SHEET = "Digital_Products_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ✅ POST: Create new order (pending)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
      paymentReference,
    } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }
    if (!customerName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!customerPhone?.trim()) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method required" }, { status: 400 });
    }
    if (!paymentReference) {
      return NextResponse.json({ error: "Payment screenshot required" }, { status: 400 });
    }

    // Load product
    const productsSheet = await getSheet(PRODUCTS_SHEET);
    const productRows = await productsSheet.getRows();
    const product = productRows.find((r) => String(r.get("Product_ID")) === String(productId));
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productTitle = String(product.get("Title") || "");
    const price = Number(product.get("Price") || 0);
    const downloadLimit = Number(product.get("Download_Limit") || 0);

    // Get or create orders sheet
    let sheet;
    try {
      sheet = await getSheet(ORDERS_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: ORDERS_SHEET,
        headerValues: [
          "Order_ID", "Product_ID", "Product_Title", "Price",
          "Customer_Name", "Customer_Phone", "Customer_Email",
          "Payment_Method", "Payment_Reference", "Payment_Amount",
          "Download_Token", "Download_Count", "Download_Limit",
          "Status", "Notes", "Created_At", "Approved_At", "Approved_By",
        ],
      });
    }

    // Generate Order ID + Download Token
    const rows = await sheet.getRows();
    const existingIds = rows.map((r) => String(r.get("Order_ID") || "")).filter((id) => id.startsWith("ORD-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("ORD-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const orderId = `ORD-${String(maxNum + 1).padStart(4, "0")}`;

    // Generate secure token
    const downloadToken = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;

    await sheet.addRow({
      Order_ID: orderId,
      Product_ID: productId,
      Product_Title: productTitle,
      Price: price,
      Customer_Name: customerName.trim(),
      Customer_Phone: customerPhone.trim(),
      Customer_Email: customerEmail?.trim() || "",
      Payment_Method: paymentMethod,
      Payment_Reference: paymentReference,
      Payment_Amount: price,
      Download_Token: downloadToken,
      Download_Count: 0,
      Download_Limit: downloadLimit,
      Status: "pending",
      Notes: "",
      Created_At: new Date().toISOString(),
      Approved_At: "",
      Approved_By: "",
    });

    return NextResponse.json({
      ok: true,
      orderId,
      message: "Order submitted! We'll verify your payment within 1-2 hours.",
    });
  } catch (e: any) {
    console.error("Digital order POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
