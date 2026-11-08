// ─── PUT: Update income (edit) ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");

  // ✅ Check edit permission
  const canEdit = await hasPermission(email, role, "canEditIncome");
  if (!canEdit) {
    return NextResponse.json(
      { error: "You don't have permission to edit income" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      id,
      date,
      incomeSource,
      incomeCategory,
      price,
      quantity,
      description,
      materials,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // ─── Load existing row ───
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Income_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    // ─── Validate source/category (if provided) ───
    let srcLabel = String(row.get("Income_Source") || "");
    let catLabel = String(row.get("Income_Category") || "");

    if (incomeSource) {
      const src = INCOME_SOURCES.find(
        (s) => s.value === String(incomeSource).toLowerCase()
      );
      if (!src) {
        return NextResponse.json({ error: "Invalid source" }, { status: 400 });
      }
      srcLabel = src.label;

      // Validate category if provided (or use first)
      if (incomeCategory) {
        const validCat = src.categories.find(
          (c) => c.value === String(incomeCategory).toLowerCase()
        );
        if (!validCat) {
          return NextResponse.json(
            { error: "Category does not belong to selected source" },
            { status: 400 }
          );
        }
        catLabel = validCat.label;
      }
    } else if (incomeCategory) {
      // If only category sent, validate against existing source
      const src = INCOME_SOURCES.find(
        (s) => s.label.toLowerCase() === srcLabel.toLowerCase()
      );
      if (src) {
        const validCat = src.categories.find(
          (c) => c.value === String(incomeCategory).toLowerCase()
        );
        if (!validCat) {
          return NextResponse.json(
            { error: "Category does not belong to selected source" },
            { status: 400 }
          );
        }
        catLabel = validCat.label;
      }
    }

    // ─── Load inventory for material operations ───
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const invById: Record<string, any> = {};
    for (const r of invRows) {
      invById[String(r.get("Item_ID"))] = r;
    }

    // ═══════════════════════════════════════════════════════════════
    // ✅ STEP 1: RESTORE OLD MATERIAL STOCK
    // ═══════════════════════════════════════════════════════════════
    const oldMaterialsJson = String(row.get("Materials_Json") || "");
    if (oldMaterialsJson) {
      try {
        const oldMaterials = JSON.parse(oldMaterialsJson);
        if (Array.isArray(oldMaterials)) {
          for (const m of oldMaterials) {
            const itemId = String(m.itemId || "");
            const qty = Number(m.usedQty || 0);
            if (!itemId || qty <= 0) continue;

            const invRow = invById[itemId];
            if (invRow) {
              const currentStock = Number(invRow.get("Stock_Quantity") || 0);
              invRow.set("Stock_Quantity", currentStock + qty);
              // Batch save at the end (see below)
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse old materials_json:", e);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ✅ STEP 2: VALIDATE & DEDUCT NEW MATERIALS
    // ═══════════════════════════════════════════════════════════════
    const materialsList: IncomeMaterial[] = Array.isArray(materials)
      ? materials
      : [];

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
      const rawCost =
        Number(invRow.get("Cost_Price") || invRow.get("Avg_Cost") || 0) || 0;
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

      // Deduct new stock (will save below)
      const currentStock = Number(invRow.get("Stock_Quantity") || 0);
      invRow.set("Stock_Quantity", Math.max(0, currentStock - usedQty));
    }

    // ─── Save all inventory changes ───
    for (const itemId of Object.keys(invById)) {
      const invRow = invById[itemId];
      await invRow.save();
    }

    // ═══════════════════════════════════════════════════════════════
    // ✅ STEP 3: UPDATE INCOME ROW
    // ═══════════════════════════════════════════════════════════════
    const newPrice = Number(price ?? row.get("Price") ?? 0);
    const newQuantity = Number(quantity ?? row.get("Quantity") ?? 1);

    if (newPrice <= 0) {
      return NextResponse.json(
        { error: "Price must be > 0" },
        { status: 400 }
      );
    }

    const totalPrice = round2(newPrice * newQuantity);
    const grossIncome = totalPrice;
    const materialCostTotal = round2(totalMaterialCost);
    const netIncome = calculateNetIncome(totalPrice, materialCostTotal);

    const firstMaterial = validatedMaterials[0];

    row.set("Date", date || row.get("Date") || new Date().toISOString().slice(0, 10));
    row.set("Income_Source", srcLabel);
    row.set("Income_Category", catLabel);
    row.set("Price", newPrice);
    row.set("Quantity", newQuantity);
    row.set("Total_Price", totalPrice);
    row.set("Description", description ?? row.get("Description") ?? "");
    row.set("Gross_Income", grossIncome);
    row.set("Used_Material", firstMaterial?.itemName || "");
    row.set("Cost_Price_ Maine", firstMaterial?.costPrice || 0);
    row.set("Pack_Size", firstMaterial?.packSize || 0);
    row.set("Used_Qty", firstMaterial?.usedQty || 0);
    row.set("Material_Cost", materialCostTotal);
    row.set("Net_Income", netIncome);
    row.set("Materials_Json", JSON.stringify(validatedMaterials));

    await row.save();

    // ✅ Invalidate caches
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
    console.error("Income PUT error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
