import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

// ─── GET: ሁሉንም inventory ምርቶች ───
export async function GET() {
  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    return NextResponse.json(rows.map((r) => r.toObject()));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: አዲስ ምርት መጨመር ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const itemId = `ITM-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Item_ID: itemId,
      Item_Name: body.name,
      Cost_Price: body.costPrice,
      Selling_Price: body.sellingPrice,
      Stock_Quantity: body.stock,
      Item_Image: body.image || "",
      Unit_Type: body.unitType || "pcs",
      Pack_Size: body.packSize || 1,
      Supplier_ID: body.supplierId || "",
      Date: new Date().toISOString().slice(0, 10),
      Item_Code: body.itemCode || itemId,
      Avg_Cost: body.costPrice,
      Reorder_Level: body.reorderLevel || 10,
      Status: "Active",
    });

    // የመጀመሪያ ክምችት ካለ → Stock_In_TBL ላይም መዝግብ
    if (Number(body.stock) > 0) {
      const stockSheet = await getSheet(SHEETS.STOCK_IN);
      const stockRows = await stockSheet.getRows();
      await stockSheet.addRow({
        Stock_In_ID: `STK-${String(stockRows.length + 1).padStart(4, "0")}`,
        Date: new Date().toISOString().slice(0, 10),
        Item_ID: itemId,
        Quantity_In: body.stock,
        Buying_Price: body.costPrice,
        Recorded_By: session.user?.email ?? "",
        Note: "Initial stock entry",
      });
    }

    return NextResponse.json({ ok: true, itemId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── PUT: ምርት ማረም ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Item_ID")) === String(body.id));
    if (!row) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if (body.name !== undefined) row.set("Item_Name", body.name);
    if (body.costPrice !== undefined) row.set("Cost_Price", body.costPrice);
    if (body.sellingPrice !== undefined) row.set("Selling_Price", body.sellingPrice);
    if (body.stock !== undefined) row.set("Stock_Quantity", body.stock);
    if (body.image !== undefined) row.set("Item_Image", body.image);
    if (body.unitType !== undefined) row.set("Unit_Type", body.unitType);
    if (body.packSize !== undefined) row.set("Pack_Size", body.packSize);
    if (body.supplierId !== undefined) row.set("Supplier_ID", body.supplierId);
    if (body.itemCode !== undefined) row.set("Item_Code", body.itemCode);
    if (body.reorderLevel !== undefined) row.set("Reorder_Level", body.reorderLevel);
    if (body.status !== undefined) row.set("Status", body.status);
    await row.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: ምርት መሰረዝ (soft delete → status "Archived") ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Item_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    row.set("Status", "Archived");
    await row.save();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
