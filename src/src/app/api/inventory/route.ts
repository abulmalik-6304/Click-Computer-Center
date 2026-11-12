// src/app/api/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc, SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";
import { refreshCache } from "@/lib/sheets-cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ═══════════════════════════════════════════════════════════════
// GET: List all inventory items
// ═══════════════════════════════════════════════════════════════
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();

    const items = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Item_ID || ""),
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || "General"),
          image: String(obj.Item_Image || ""),
          stock: Number(obj.Stock_Quantity || 0),
          costPrice: Number(obj.Cost_Price || 0),
          sellingPrice: Number(obj.Selling_Price || 0),
          avgCost: Number(obj.Avg_Cost || obj.Cost_Price || 0),
          unitType: String(obj.Unit_Type || "pcs"),
          packSize: Number(obj.Pack_Size || 1),
          reorderLevel: Number(obj.Reorder_Level || 10),
          status: String(obj.Status || "Active"),
          supplierId: String(obj.Supplier_ID || ""),
          date: String(obj.Date || ""),
          description: String(obj.Description || ""),
        };
      })
      .filter((i) => i.status !== "Archived");

    return NextResponse.json({ items });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ items: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST: Create new inventory item
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  const email = String(session.user?.email || "");

  // ✅ Owner/manager always, employee/staff need explicit permission
  const isEmployee = role === "employee" || role === "staff";
  if (isEmployee) {
    // Load employee permissions
    const { getSheet: getEmpSheet, SHEETS: EMP_SHEETS } = await import(
      "@/lib/google-sheets"
    );
    const { parseEmployeePermissions } = await import(
      "@/lib/employee-permissions"
    );

    try {
      const permSheet = await getEmpSheet("Employee_Permissions_TBL");
      const permRows = await permSheet.getRows();
      const myPerm = permRows.find(
        (r) =>
          String((r.toObject() as any).Employee_Email || "").toLowerCase() ===
          email.toLowerCase()
      );
      const perms = myPerm
        ? parseEmployeePermissions(email, myPerm.toObject())
        : parseEmployeePermissions(email, {});

      if (!perms.canRegisterInventory) {
        return NextResponse.json(
          { error: "No permission to register inventory" },
          { status: 403 }
        );
      }
    } catch {
      // Sheet missing → deny by default
      return NextResponse.json(
        { error: "No permission to register inventory" },
        { status: 403 }
      );
    }
  }

  try {
    const body = await req.json();
    const {
      itemName,
      itemCode,
      category,
      costPrice,
      sellingPrice,
      stockQuantity,
      unitType,
      packSize,
      reorderLevel,
      description,
      image,
      supplierId,
    } = body;

    // ─── Validation ───
    if (!itemName?.trim()) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }
    if (Number(costPrice) <= 0) {
      return NextResponse.json(
        { error: "Cost price must be > 0" },
        { status: 400 }
      );
    }
    if (Number(sellingPrice) <= 0) {
      return NextResponse.json(
        { error: "Selling price must be > 0" },
        { status: 400 }
      );
    }
    if (Number(sellingPrice) < Number(costPrice)) {
      return NextResponse.json(
        { error: "Selling price must be >= cost price" },
        { status: 400 }
      );
    }

    // ─── Get or create sheet ───
    let sheet;
    try {
      sheet = await getSheet(SHEETS.INVENTORY);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SHEETS.INVENTORY,
        headerValues: [
          "Item_ID",
          "Item_Code",
          "Item_Name",
          "Category",
          "Item_Image",
          "Cost_Price",
          "Selling_Price",
          "Avg_Cost",
          "Stock_Quantity",
          "Unit_Type",
          "Pack_Size",
          "Reorder_Level",
          "Status",
          "Supplier_ID",
          "Description",
          "Date",
        ],
      });
    }

    // ─── Generate Item_ID + Item_Code ───
    const rows = await sheet.getRows();
    const existingIds = rows
      .map((r) => String(r.get("Item_ID") || ""))
      .filter((id) => id.startsWith("ITM-"));

    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("ITM-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);

    const newId = `ITM-${String(maxNum + 1).padStart(5, "0")}`;
    const finalCode = itemCode?.trim() || newId;

    const newRow = {
      Item_ID: newId,
      Item_Code: finalCode,
      Item_Name: itemName.trim(),
      Category: category || "General",
      Item_Image: image || "",
      Cost_Price: Number(costPrice),
      Selling_Price: Number(sellingPrice),
      Avg_Cost: Number(costPrice),
      Stock_Quantity: Number(stockQuantity || 0),
      Unit_Type: unitType || "pcs",
      Pack_Size: Number(packSize || 1),
      Reorder_Level: Number(reorderLevel || 10),
      Status: "Active",
      Supplier_ID: supplierId || "",
      Description: description || "",
      Date: new Date().toISOString().slice(0, 10),
    };

    await sheet.addRow(newRow);
    await refreshCache(SHEETS.INVENTORY);

    return NextResponse.json({
      ok: true,
      id: newId,
      item: {
        id: newId,
        name: newRow.Item_Name,
        code: newRow.Item_Code,
        category: newRow.Category,
        stock: newRow.Stock_Quantity,
        costPrice: newRow.Cost_Price,
        sellingPrice: newRow.Selling_Price,
      },
    });
  } catch (e: any) {
    console.error("Inventory POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT: Update existing inventory item
// ═══════════════════════════════════════════════════════════════
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  const email = String(session.user?.email || "");

  const canEdit = await hasPermission(email, role, "canEditInventory");
  // Allow owner/manager OR employee with inventory permission
  if (!canEdit && role !== "owner" && role !== "manager") {
    return NextResponse.json(
      { error: "No permission to edit inventory" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Item_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // ─── Apply updates ───
    if (updates.name !== undefined) row.set("Item_Name", updates.name);
    if (updates.itemCode !== undefined) row.set("Item_Code", updates.itemCode);
    if (updates.category !== undefined) row.set("Category", updates.category);
    if (updates.image !== undefined) row.set("Item_Image", updates.image);
    if (updates.costPrice !== undefined) row.set("Cost_Price", Number(updates.costPrice));
    if (updates.sellingPrice !== undefined) row.set("Selling_Price", Number(updates.sellingPrice));
    if (updates.stockQuantity !== undefined) row.set("Stock_Quantity", Number(updates.stockQuantity));
    if (updates.unitType !== undefined) row.set("Unit_Type", updates.unitType);
    if (updates.packSize !== undefined) row.set("Pack_Size", Number(updates.packSize));
    if (updates.reorderLevel !== undefined) row.set("Reorder_Level", Number(updates.reorderLevel));
    if (updates.status !== undefined) row.set("Status", updates.status);
    if (updates.description !== undefined) row.set("Description", updates.description);
    if (updates.supplierId !== undefined) row.set("Supplier_ID", updates.supplierId);

    await row.save();
    await refreshCache(SHEETS.INVENTORY);

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error("Inventory PUT error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE: Archive inventory item (soft delete)
// ═══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json(
      { error: "Only owner/manager can delete items" },
      { status: 403 }
    );
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Item_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // ✅ Soft delete → archive
    row.set("Status", "Archived");
    await row.save();
    await refreshCache(SHEETS.INVENTORY);

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error("Inventory DELETE error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
