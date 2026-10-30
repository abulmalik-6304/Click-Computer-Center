// src/lib/public-data.ts
// ═══════════════════════════════════════════════════════════════
// 🌐 PUBLIC DATA (server only) — reads from Google Sheets
// ⚠️  NEVER import this file in a "use client" component.
//     For static data (courses, services), use public-constants.ts.
// ═══════════════════════════════════════════════════════════════

import "server-only";
import { getSheet, SHEETS } from "./google-sheets";

export interface PublicProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  image: string;
  sellingPrice: number;
  stock: number;
  unitType: string;
  inStock: boolean;
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    return rows
      .map((r) => {
        const obj = r.toObject() as any;
        const stock = Number(obj.Stock_Quantity ?? 0);
        return {
          id: String(obj.Item_ID || ""),
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          sellingPrice: Number(obj.Selling_Price ?? 0),
          stock,
          unitType: String(obj.Unit_Type || "pcs"),
          inStock: stock > 0,
        };
      })
      .filter((p) => p.name && p.sellingPrice > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
