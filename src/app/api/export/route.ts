// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export async function POST(req: NextRequest) {
  const { rows, format } = await req.json();

  if (format === 'xlsx' || format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="sales.${format}"`,
      },
    });
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30 });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    const done = new Promise<Buffer>(res => doc.on('end', () => res(Buffer.concat(chunks))));
    doc.fontSize(16).text('Click Computer Center — Sales Report', { underline: true });
    doc.moveDown();
    rows.forEach((r: any) => {
      const profit = ((r.unitPrice - r.unitCost) * r.quantity).toFixed(2);
      doc.fontSize(10).text(
        `${r.date.slice(0,10)} · ${r.productName} · Qty ${r.quantity} · ${r.unitPrice} ETB · Profit ${profit} ETB`
      );
    });
    doc.end();
    const buf = await done;
    return new NextResponse(buf, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="sales.pdf"' },
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
