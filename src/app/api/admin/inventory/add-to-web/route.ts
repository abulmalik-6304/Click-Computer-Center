// src/app/api/admin/inventory/add-to-web/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { itemId, displayPrice, displayName, description } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    // Load inventory item
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const inv = invRows.find((r) => String(r.get("Item_ID")) === String(itemId));
    if (!inv) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    // Load or create Web_Products_TBL
    let sheet;
    try {
      sheet = await getSheet("Web_Products_TBL");
    } catch {
      const { getDoc } = await import("@/lib/google-sheets");
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: "Web_Products_TBL",
        headerValues: [
          "Web_Product_ID", "Item_ID", "Display_Name", "Display_Price",
          "Show_On_Web", "Featured", "Web_Description", "Web_Image",
          "Display_Order", "Added_At",
        ],
      });
    }

    const rows = await sheet.getRows();

    // Check if already added
    const existing = rows.find((r) => String(r.get("Item_ID")) === String(itemId));

    const invObj = inv.toObject() as any;

    if (existing) {
      // Toggle Show_On_Web
      existing.set("Show_On_Web", "TRUE");
      if (displayPrice !== undefined) existing.set("Display_Price", Number(displayPrice));
      if (displayName) existing.set("Display_Name", displayName);
      if (description !== undefined) existing.set("Web_Description", description);
      await existing.save();
      return NextResponse.json({ ok: true, id: String(existing.get("Web_Product_ID")), updated: true });
    }

    // New entry
    const existingIds = rows.map((r) => String(r.get("Web_Product_ID") || "")).filter((id) => id.startsWith("WEB-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("WEB-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `WEB-${String(maxNum + 1).padStart(4, "0")}`;

    await sheet.addRow({
      Web_Product_ID: newId,
      Item_ID: itemId,
      Display_Name: displayName || String(invObj.Item_Name || ""),
      Display_Price: Number(displayPrice || invObj.Selling_Price || 0),
      Show_On_Web: "TRUE",
      Featured: "FALSE",
      Web_Description: description || "",
      Web_Image: String(invObj.Item_Image || ""),
      Display_Order: 999,
      Added_At: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, id: newId, created: true });
  } catch (e: any) {
    console.error("Add to web error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
