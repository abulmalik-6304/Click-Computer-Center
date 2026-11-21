// src/app/api/public/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 60; // Cache 1 min
export const dynamic = "force-dynamic";

interface WebProduct {
  id: string;
  itemId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
  displayOrder: number;
}

// ✅ GET: Public products list (from Web_Products_TBL)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const category = searchParams.get("category") || "all";
    const featuredOnly = searchParams.get("featured") === "true";
    const limit = Math.min(100, Number(searchParams.get("limit") || 50));

    // Load Web_Products_TBL
    const webSheet = await getSheet("Web_Products_TBL");
    const webRows = await webSheet.getRows();
    const webProducts = webRows.map((r) => r.toObject() as any);

    // Load Inventory_TBL for stock + image fallback
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const invMap: Record<string, any> = {};
    for (const r of invRows) {
      const o = r.toObject() as any;
      invMap[String(o.Item_ID || "")] = o;
    }

    // Build product list
    let products: WebProduct[] = webProducts
      .filter((w) => String(w.Show_On_Web || "").toUpperCase() === "TRUE")
      .map((w) => {
        const inv = invMap[String(w.Item_ID || "")] || {};

        return {
          id: String(w.Web_Product_ID || ""),
          itemId: String(w.Item_ID || ""),
          name: String(w.Display_Name || inv.Item_Name || ""),
          price: Number(w.Display_Price || inv.Selling_Price || 0),
          description: String(w.Web_Description || ""),
          image: String(w.Web_Image || inv.Item_Image || ""),
          category: String(inv.Category || "General"),
          stock: Number(inv.Stock_Quantity || 0),
          featured:
            String(w.Featured || "").toUpperCase() === "TRUE",
          displayOrder: Number(w.Display_Order || 999),
        };
      })
      // Only show if item exists in inventory + stock > 0
      .filter((p) => p.name && p.itemId && p.stock > 0);

    // Apply filters
    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }
    if (category !== "all") {
      products = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (featuredOnly) {
      products = products.filter((p) => p.featured);
    }

    // Sort by display order, then featured, then name
    products.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.displayOrder !== b.displayOrder)
        return a.displayOrder - b.displayOrder;
      return a.name.localeCompare(b.name);
    });

    // Categories (unique)
    const categories = Array.from(new Set(products.map((p) => p.category)));

    return NextResponse.json({
      products: products.slice(0, limit),
      total: products.length,
      categories,
    });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({
        products: [],
        total: 0,
        categories: [],
      });
    }
    console.error("Public products error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
