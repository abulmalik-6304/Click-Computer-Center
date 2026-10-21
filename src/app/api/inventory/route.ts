import { NextRequest, NextResponse } from "next/server";
import { appendRowToTable, SHEETS } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, stock, minStock, unitPrice, unitCost, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const newItem = {
      id: "PROD-" + Date.now().toString().slice(-5),
      name: name,
      category: category || "General",
      stock: Number(stock || 0),
      minStock: Number(minStock || 5),
      unitPrice: Number(unitPrice || 0),
      unitCost: Number(unitCost || 0),
      imageUrl: imageUrl || "",
    };

    const result = await appendRowToTable(SHEETS.INVENTORY, newItem);

    if (result.success) {
      return NextResponse.json({ success: true, item: newItem });
    } else {
      return NextResponse.json({ error: result.error || "Failed to add item" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Error adding inventory item:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
