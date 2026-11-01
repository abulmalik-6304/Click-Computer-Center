// src/app/api/suppliers/list/route.ts
import { NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

export const revalidate = 0;

export async function GET() {
  try {
    const sheet = await getSheet("Supplier_TBL");
    const rows = await sheet.getRows();
    const suppliers = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Supplier_ID || ""),
        name: String(obj.Supplier_Name || ""),
        company: String(obj.Company_Name || ""),
        supplyItem: String(obj.Supply_Item || ""),
      };
    });
    return NextResponse.json({ suppliers });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ suppliers: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
