// src/app/api/income/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc, SHEETS } from "@/lib/google-sheets";
import { refreshCache } from "@/lib/sheets-cache";
import { INCOME_SOURCES } from "@/lib/income-categories";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";
import {
  calculateMaterialCost,
  calculateNetIncome,
  IncomeMaterial,
} from "@/lib/income-types";

const SHEET = "Income_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List income ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const source = searchParams.get("source") || "all";
    const category = searchParams.get("category") || "all";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();

    let income = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Income_ID || ""),
        date: String(obj.Date || ""),
        incomeSource: String(obj.Income_Source || ""),
        price: Number(obj.Price || 0),
        quantity: Number(obj.Quantity || 1),
        totalPrice: Number(obj.Total_Price || 0),
        recordedBy: String(obj.Recorded_By || ""),
        incomeCategory: String(obj.Income_Category || ""),
        description: String(obj.Description || ""),
        grossIncome: Number(obj.Gross_Income || 0),
        usedMaterial: String(obj.Used_Material || ""),
        costPriceMain: Number(obj["Cost_Price_ Maine"] || 0),
        packSize: Number(obj.Pack_Size || 0),
        usedQty: Number(obj.Used_Qty || 0),
        materialCost: Number(obj.Material_Cost || 0),
        netIncome: Number(obj.Net_Income || 0),
        materialsJson: String(obj.Materials_Json || ""),
      };
    });

    // Filters
    if (from) {
      const fd = new Date(from);
      income = income.filter((i) => new Date(i.date) >= fd);
    }
    if (to) {
      const td = new Date(to);
      td.setHours(23, 59, 59, 999);
      income = income.filter((i) => new Date(i.date) <= td);
    }
    if (source !== "all") {
      income = income.filter(
        (i) => i.incomeSource.toLowerCase() === source.toLowerCase()
      );
    }
    if (category !== "all") {
      income = income.filter(
        (i) => i.incomeCategory.toLowerCase() === category.toLowerCase()
      );
    }
    if (q) {
      income = income.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.recordedBy.toLowerCase().includes(q) ||
          i.incomeCategory.toLowerCase().includes(q)
      );
    }

    income.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalPrice = income.reduce((s, i) => s + i.totalPrice, 0);
    const totalCost = income.reduce((s, i) => s + i.materialCost, 0);
    const totalNet = income.reduce((s, i) => s + i.netIncome, 0);

    return NextResponse.json({
      income,
      totals: {
        totalPrice: round2(totalPrice),
        totalCost: round2(totalCost),
        totalNet: round2(totalNet),
      },
      count: income.length,
    });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({
        income: [],
        totals: { totalPrice: 0, totalCost: 0, totalNet: 0 },
        count: 0,
      });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create income ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      date,
      incomeSource,
      incomeCategory,
      price,
      quantity,
      description,
      materials,
    } = body;

    // ─── Validation ───
    if (!incomeSource || !incomeCategory) {
      return NextResponse.json(
        { error: "Source and category required" },
        { status: 400 }
      );
    }
    if (!price || Number(price) <= 0) {
      return NextResponse.json(
        { error: "Price must be > 0" },
        { status: 400 }
      );
    }

    const src = INCOME_SOURCES.find(
      (s) => s.value === String(incomeSource).toLowerCase()
    );
    if (!src) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }
    const validCat = src.categories.find(
      (c) => c.value === String(incomeCategory).toLowerCase()
    );
    if (!validCat) {
      return NextResponse.json(
        { error: "Category does not belong to selected source" },
        { status: 400 }
      );
    }

    // ─── Process materials ───
    const materialsList: IncomeMaterial[] = Array.isArray(materials)
      ? materials
      : [];

    // Validate materials + get current inventory
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const invById: Record<string, any> = {};
    for (const r of invRows) {
      invById[String(r.get("Item_ID"))] = r;
    }

    let totalMaterialCost = 0;
    const validatedMaterials: IncomeMaterial[] = [];

    for (const m of materialsList) {
      const invRow = invById[m.itemId];
      if (!invRow) {
        return NextResponse.json(
          { error: `Material ${m.itemId} not found` },
          { status: 404 }
        );
      }

      const itemName = String(invRow.get("Item_Name") || "");
      const itemImage = String(invRow.get("Item_Image") || "");
      const rawCost = Number(
        invRow.get("Cost_Price") || invRow.get("Avg_Cost") || 0
      ) || 0;
      const packSize = Number(invRow.get("Pack_Size") || 1) || 1;
      const usedQty = Number(m.usedQty) || 0;

      if (usedQty <= 0) {
        return NextResponse.json(
          { error: `Used qty for ${itemName} must be > 0` },
          { status: 400 }
        );
      }

      const cost = calculateMaterialCost(rawCost, packSize, usedQty);
      totalMaterialCost += cost;

      validatedMaterials.push({
        itemId: String(m.itemId),
        itemName,
        itemImage,
        costPrice: rawCost,
        packSize,
        usedQty,
        materialCost: cost,
      });
    }

    // ─── Totals ───
    const totalPrice = round2(Number(price) * Number(quantity || 1));
    const grossIncome = totalPrice;
    const materialCostTotal = round2(totalMaterialCost);
    const netIncome = calculateNetIncome(totalPrice, materialCostTotal);

    // ─── Save income ───
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `INC-${String(nextNum).padStart(4, "0")}`;

    // First material (legacy single-material columns)
    const firstMaterial = validatedMaterials[0];

    await sheet.addRow({
      Income_ID: id,
      Date: date || new Date().toISOString().slice(0, 10),
      Income_Source: src.label,
      Price: Number(price),
      Quantity: Number(quantity || 1),
      Total_Price: totalPrice,
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
      All_Income_Total: "",
      Income_Category: validCat.label,
      Description: description || "",
      Gross_Income: grossIncome,
      Used_Material: firstMaterial?.itemName || "",
      "Cost_Price_ Maine": firstMaterial?.costPrice || 0,
      Pack_Size: firstMaterial?.packSize || 0,
      Used_Qty: firstMaterial?.usedQty || 0,
      Material_Cost: materialCostTotal,
      Net_Income: netIncome,
      Materials_Json: JSON.stringify(validatedMaterials),
    });

    // ═══════════════════════════════════════════════════════════════
    // ✅ DEDUCT MATERIAL STOCK
    // ═══════════════════════════════════════════════════════════════
    for (const m of validatedMaterials) {
      const invRow = invById[m.itemId];
      if (!invRow) continue;

      const currentStock = Number(invRow.get("Stock_Quantity") || 0);
      const newStock = Math.max(0, currentStock - m.usedQty);
      invRow.set("Stock_Quantity", newStock);
      await invRow.save();
    }

    // Invalidate caches
    await refreshCache(SHEET);
    await refreshCache(SHEETS.INVENTORY);

    return NextResponse.json({
      ok: true,
      id,
      totalPrice,
      materialCost: materialCostTotal,
      netIncome,
      materialsUsed: validatedMaterials.length,
    });
  } catch (e: any) {
    console.error("Income POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE — Restore material stock + delete row ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");

  // ✅ Check permission
  const canDelete = await hasPermission(email, role, "canDeleteIncome");
  if (!canDelete) {
    return NextResponse.json(
      { error: "You don't have permission to delete income" },
      { status: 403 }
    );
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Income_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const obj = row.toObject() as any;
    const materialsJson = String(obj.Materials_Json || "");

    // ═══════════════════════════════════════════════════════════════
    // ✅ RESTORE MATERIAL STOCK
    // ═══════════════════════════════════════════════════════════════
    let restoredCount = 0;
    const restoredMaterials: { name: string; qty: number }[] = [];

    if (materialsJson) {
      try {
        const materials = JSON.parse(materialsJson);
        if (Array.isArray(materials) && materials.length > 0) {
          const invSheet = await getSheet(SHEETS.INVENTORY);
          const invRows = await invSheet.getRows();

          for (const m of materials) {
            const itemId = String(m.itemId || "");
            const qty = Number(m.usedQty || 0);
            if (!itemId || qty <= 0) continue;

            const invRow = invRows.find(
              (r) => String(r.get("Item_ID")) === itemId
            );
            if (invRow) {
              const currentStock = Number(invRow.get("Stock_Quantity") || 0);
              invRow.set("Stock_Quantity", currentStock + qty);
              await invRow.save();
              restoredCount++;
              restoredMaterials.push({
                name: String(m.itemName || itemId),
                qty,
              });
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse materials_json:", e);
      }
    }

    // ✅ Delete income row
    await row.delete();

    // ✅ Invalidate caches
    await refreshCache(SHEET);
    await refreshCache(SHEETS.INVENTORY);

    return NextResponse.json({
      ok: true,
      id,
      restoredCount,
      restoredMaterials,
    });
  } catch (e: any) {
    console.error("Income DELETE error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
