// src/app/api/public/digital-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const PRODUCTS_SHEET = "Digital_Products_TBL";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const category = searchParams.get("category") || "all";
    const featuredOnly = searchParams.get("featured") === "true";
    const limit = Math.min(100, Number(searchParams.get("limit") || 50));

    const sheet = await getSheet(PRODUCTS_SHEET);
    const rows = await sheet.getRows();

    let products = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Product_ID || ""),
          title: String(o.Title || ""),
          description: String(o.Description || ""),
          price: Number(o.Price || 0),
          category: String(o.Category || ""),
          thumbnailImage: String(o.Thumbnail_Image || ""),
          fileSize: Number(o.File_Size || 0),
          fileType: String(o.File_Type || ""),
          featured: String(o.Featured || "").toUpperCase() === "TRUE",
          showOnWeb: String(o.Show_On_Web || "").toUpperCase() === "TRUE",
          status: String(o.Status || "").toLowerCase(),
        };
      })
      .filter((p) => p.showOnWeb && p.status === "active" && p.title);

    if (search) {
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }
    if (category !== "all") {
      products = products.filter((p) => p.category === category);
    }
    if (featuredOnly) {
      products = products.filter((p) => p.featured);
    }

    products.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.title.localeCompare(b.title);
    });

    const categories = Array.from(new Set(products.map((p) => p.category)));

    return NextResponse.json({
      products: products.slice(0, limit),
      total: products.length,
      categories,
    });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ products: [], total: 0, categories: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
