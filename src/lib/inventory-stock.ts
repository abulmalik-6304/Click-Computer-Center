// src/lib/inventory-stock.ts
// ═══════════════════════════════════════════════════════════════
// 📦 INVENTORY STOCK CALCULATOR
// Since AppSheet doesn't write Stock_Quantity to the sheet,
// we calculate stock from:
//   Current Stock = Total Purchased - Total Sold
// ═══════════════════════════════════════════════════════════════

import { getSheet, SHEETS } from "./google-sheets";

export interface StockCalculation {
  itemId: string;
  totalPurchased: number;
  totalSold: number;
  currentStock: number;
}

/**
 * Calculate stock for all items at once.
 * Reads Stock_In_TBL (purchases) and Sales_Items_TBL (sales).
 */
export async function calculateAllStock(): Promise<
  Record<string, StockCalculation>
> {
  const result: Record<string, StockCalculation> = {};

  // 1. Load purchases from Stock_In_TBL
  try {
    const stockInSheet = await getSheet(SHEETS.STOCK_IN);
    const stockInRows = await stockInSheet.getRows();

    for (const row of stockInRows) {
      const obj = row.toObject() as any;
      const itemId = String(obj.Item_ID || "");
      if (!itemId) continue;

      const qty = Number(obj.Quantity_In || obj.Quantity || 0) || 0;

      if (!result[itemId]) {
        result[itemId] = {
          itemId,
          totalPurchased: 0,
          totalSold: 0,
          currentStock: 0,
        };
      }
      result[itemId].totalPurchased += qty;
    }
  } catch (e) {
    console.error("Stock_In load error:", e);
  }

  // 2. Load sales from Sales_Items_TBL
  try {
    const salesItemsSheet = await getSheet(SHEETS.SALES_ITEMS);
    const salesItemRows = await salesItemsSheet.getRows();

    for (const row of salesItemRows) {
      const obj = row.toObject() as any;
      const itemId = String(obj.Item_ID || "");
      if (!itemId) continue;

      const qty = Number(obj.Quantity || 0) || 0;

      if (!result[itemId]) {
        result[itemId] = {
          itemId,
          totalPurchased: 0,
          totalSold: 0,
          currentStock: 0,
        };
      }
      result[itemId].totalSold += qty;
    }
  } catch (e) {
    console.error("Sales_Items load error:", e);
  }

  // 3. Calculate current stock
  for (const id of Object.keys(result)) {
    result[id].currentStock = Math.max(
      0,
      result[id].totalPurchased - result[id].totalSold
    );
  }

  return result;
}

/**
 * Calculate stock for a single item.
 */
export async function calculateItemStock(
  itemId: string
): Promise<StockCalculation> {
  const all = await calculateAllStock();
  return (
    all[itemId] || {
      itemId,
      totalPurchased: 0,
      totalSold: 0,
      currentStock: 0,
    }
  );
}
