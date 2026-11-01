// src/app/api/customers/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";

export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet("Customer_TBL");
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: "Customer_TBL",
        headerValues: [
          "Customer_ID",
          "Customer_Name",
          "Phone_Number",
          "Customer_Type",
          "Customer_Email",
          "Address",
          "Recorded_By",
        ],
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `CUS-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Customer_ID: id,
      Customer_Name: body.name,
      Phone_Number: body.phone || "",
      Customer_Type: body.type || "Regular",
      Customer_Email: body.email || "",
      Address: body.address || "",
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
    });

    return NextResponse.json({
      ok: true,
      customer: {
        id,
        name: body.name,
        phone: body.phone || "",
        type: body.type || "Regular",
        email: body.email || "",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
