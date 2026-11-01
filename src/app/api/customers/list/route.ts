// src/app/api/customers/list/route.ts
import { NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

export const revalidate = 0;

export async function GET() {
  try {
    const sheet = await getSheet("Customer_TBL");
    const rows = await sheet.getRows();
    const customers = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Customer_ID || ""),
        name: String(obj.Customer_Name || ""),
        phone: String(obj.Phone_Number || ""),
        type: String(obj.Customer_Type || "Regular"),
        email: String(obj.Customer_Email || ""),
      };
    });
    return NextResponse.json({ customers });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ customers: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
