import { NextRequest, NextResponse } from 'next/server';
import { getSheet, SHEETS } from '@/lib/google-sheets';
import { deductInventory } from '@/lib/financial-engine';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const invSheet = await getSheet(SHEETS.INVENTORY);
  const invRows = await invSheet.getRows();
  const item = invRows.find(r => r.get('id') === body.productId);
  if (!item) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // ⚠️ PROTECTED: uses frozen deductInventory — never allow negative stock.
  let newStock: number;
  try {
    newStock = deductInventory(Number(item.get('stock')), Number(body.quantity));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  item.set('stock', newStock);
  await item.save();

  const salesSheet = await getSheet(SHEETS.SALES);
  await salesSheet.addRow({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    productId: body.productId,
    productName: item.get('name'),
    quantity: body.quantity,
    unitPrice: body.unitPrice,
    unitCost: item.get('costPrice'),   // cost pulled from inventory master
    staffId: (session.user as any).id,
  });

  return NextResponse.json({ ok: true, newStock });
}
