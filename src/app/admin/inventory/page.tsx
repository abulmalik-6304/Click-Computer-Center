// src/app/admin/inventory/page.tsx
// ... (imports)

export default async function InventoryPage() {
  // ... (session check)

  let items: InventoryItem[] = [];

  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const stockMap = await calculateAllStock();

    items = rows
      .map((r) => {
        const obj = r.toObject() as any;
        const itemId = String(obj.Item_ID || "");
        const calc = stockMap[itemId];
        const totalPurchased = calc?.totalPurchased ?? 0;
        const totalSold = calc?.totalSold ?? 0;
        const stock = calc?.currentStock ?? 0;

        return {
          id: itemId,
          name: String(obj.Item_Name || "Unknown Item"),  // ✅ Fallback
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          stock: Number(stock) || 0,                       // ✅ Number()
          costPrice: Number(obj.Cost_Price) || 0,          // ✅ Number()
          sellingPrice: Number(obj.Selling_Price) || 0,    // ✅ Number()
          avgCost: Number(obj.Avg_Cost || obj.Cost_Price) || 0,
          unitType: String(obj.Unit_Type || "pcs"),
          reorderLevel: Number(obj.Reorder_Level) || 10,   // ✅ Number()
          status: String(obj.Status || "Active"),
          supplierId: String(obj.Supplier_ID || ""),
          date: String(obj.Date || ""),
          totalPurchased: Number(totalPurchased) || 0,
          totalSold: Number(totalSold) || 0,
        };
      })
      .filter((i) => i.status !== "Archived" && i.name);
  } catch (e) {
    console.error("Inventory load error:", e);
  }

  const email = String(session.user?.email || "");
  const canEdit = await hasPermission(email, role, "canEditInventory");

  return (
    <InventoryClient
      initialItems={items}
      userRole={role}
      canEdit={canEdit}
    />
  );
}
