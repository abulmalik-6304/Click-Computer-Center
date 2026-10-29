// src/app/api/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { ExportPayload } from "@/lib/export-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload: ExportPayload = await req.json();

    if (!payload?.kind || !payload?.format || !payload?.columns || !payload?.rows) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (payload.format === "xlsx" || payload.format === "csv") {
      return exportSpreadsheet(payload);
    }

    return NextResponse.json(
      { error: "PDF export is disabled. Please use Excel (XLSX) or CSV." },
      { status: 400 }
    );
  } catch (e: any) {
    console.error("Export error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── Spreadsheet (XLSX / CSV) ───
function exportSpreadsheet(payload: ExportPayload) {
  const rowsForSheet = payload.rows.map((row) => {
    const out: Record<string, any> = {};
    for (const c of payload.columns) {
      out[c.label] = (row as Record<string, any>)[c.key] ?? "";
    }
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(rowsForSheet);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, titleSheetName(payload.kind));

  const filename = `${payload.kind}-${payload.generatedAt.slice(0, 10)}`;
  const buf: Buffer =
    payload.format === "csv"
      ? XLSX.write(wb, { type: "buffer", bookType: "csv" })
      : XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const contentType =
    payload.format === "csv"
      ? "text/csv; charset=utf-8"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}.${payload.format}"`,
      "Cache-Control": "no-store",
    },
  });
}

function titleSheetName(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
