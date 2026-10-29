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
    if (payload.format === "pdf") {
      return exportPdf(payload);
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
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

  // 🎯 Fix 1: Buffer ን ወደ Uint8Array በመቀየር የ TypeScript ኤረርን ማስወገድ
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}.${payload.format}"`,
      "Cache-Control": "no-store",
    },
  });
}

// ─── PDF ───
async function exportPdf(payload: ExportPayload): Promise<NextResponse> {
  // 🎯 Fix 2: Turbopack Build ግጭትን ለመከላከል pdfkit ን በ Dynamic Import መጥራት
  const PDFDocument = (await import("pdfkit")).default;

  const doc = new PDFDocument({
    size: "A4",
    margin: 30,
    info: {
      Title: payload.title,
      Author: "Click Computer Center",
      CreationDate: new Date(),
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // ─── Header banner ───
  doc.rect(0, 0, doc.page.width, 70).fill("#0f172a");
  doc
    .fillColor("#ffffff")
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("CLICK COMPUTER CENTER", 30, 18);
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#f97316")
    .text("Enterprise Reports · Ethiopia", 30, 42);
  doc
    .fontSize(9)
    .fillColor("#e2e8f0")
    .text(`Generated: ${new Date(payload.generatedAt).toLocaleString()}`, 30, 55, {
      width: doc.page.width - 60,
      align: "right",
    });

  // ─── Title ───
  doc.moveDown(3);
  doc
    .fillColor("#0f172a")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(payload.title, 30, 90);
  if (payload.rangeLabel) {
    doc.fontSize(9).font("Helvetica").fillColor("#64748b").text(payload.rangeLabel, 30, 108);
  }

  // ─── Table ───
  const tableTop = 130;
  const rowHeight = 20;
  const startX = 30;
  const usableWidth = doc.page.width - 60;
  const totalWeight = payload.columns.reduce((s, c) => s + (c.width ?? 60), 0);

  // Compute actual widths
  const widths = payload.columns.map((c) =>
    Math.floor(((c.width ?? 60) / totalWeight) * usableWidth)
  );

  // ─── Header row ───
  let x = startX;
  doc.rect(startX, tableTop, usableWidth, rowHeight).fill("#1e293b");
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  for (let i = 0; i < payload.columns.length; i++) {
    const col = payload.columns[i];
    doc.text(col.label, x + 4, tableTop + 6, {
      width: widths[i] - 8,
      align: col.align ?? "left",
      ellipsis: true,
    });
    x += widths[i];
  }

  // ─── Data rows ───
  let y = tableTop + rowHeight;
  const rowsPerPage = Math.floor((doc.page.height - y - 80) / rowHeight);

  for (let r = 0; r < payload.rows.length; r++) {
    if (r > 0 && r % rowsPerPage === 0) {
      doc.addPage();
      y = 40;
      let hx = startX;
      doc.rect(startX, y, usableWidth, rowHeight).fill("#1e293b");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      for (let i = 0; i < payload.columns.length; i++) {
        const col = payload.columns[i];
        doc.text(col.label, hx + 4, y + 6, {
          width: widths[i] - 8,
          align: col.align ?? "left",
          ellipsis: true,
        });
        hx += widths[i];
      }
      y += rowHeight;
    }

    const row = payload.rows[r];
    const rowBg = r % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(startX, y, usableWidth, rowHeight).fill(rowBg);

    let cx = startX;
    doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica");
    for (let i = 0; i < payload.columns.length; i++) {
      const col = payload.columns[i];
      const raw = (row as Record<string, any>)[col.key];
      const text = formatCell(raw, col.key);
      doc.text(text, cx + 4, y + 6, {
        width: widths[i] - 8,
        align: col.align ?? "left",
        ellipsis: true,
      });
      cx += widths[i];
    }

    y += rowHeight;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
    }
  }

  // ─── Footer ───
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor("#64748b")
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Click Computer Center · Confidential · Page ${i + 1} of ${pages.count}`,
        30,
        doc.page.height - 30,
        { width: doc.page.width - 60, align: "center" }
      );
  }

  doc.end();

  const buf = await done;
  const filename = `${payload.kind}-${payload.generatedAt.slice(0, 10)}`;

  // 🎯 Fix 3: Buffer ን ወደ Uint8Array ቀይሮ በ Clean Async/Await መመለስ
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function formatCell(raw: any, key: string): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number") {
    if (key.toLowerCase().includes("margin")) return raw.toFixed(2) + "%";
    if (key.toLowerCase().includes("date")) return String(raw);
    return raw.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(raw);
}

function titleSheetName(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
