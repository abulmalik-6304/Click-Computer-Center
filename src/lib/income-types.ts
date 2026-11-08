// src/lib/income-types.ts
// ═══════════════════════════════════════════════════════════════
// 💰 INCOME SYSTEM — Types
// ═══════════════════════════════════════════════════════════════

export interface IncomeMaterial {
  itemId: string;
  itemName: string;
  itemImage: string;
  costPrice: number; // total pack price
  packSize: number; // qty in pack
  usedQty: number; // how many we used
  materialCost: number; // (costPrice / packSize) × usedQty
}

export interface IncomeForm {
  date: string;
  incomeSource: string;
  incomeCategory: string;
  price: number;
  quantity: number;
  description: string;
  materials: IncomeMaterial[];
}

export interface IncomeRecord {
  id: string;
  date: string;
  incomeSource: string;
  incomeCategory: string;
  price: number;
  quantity: number;
  totalPrice: number;
  grossIncome: number; // ← table ይጠቀመዋል
  materialCost: number;
  netIncome: number;

  // Legacy single-material columns (still written by API for backward compatibility)
  usedMaterial: string;
  costPriceMain: number;
  packSize: number;
  usedQty: number;

  // Optional metadata
  description?: string;
  recordedBy?: string;
  materialsJson?: string; // ← parseMaterials ይጠቀመዋል
  createdAt?: string;
  updatedAt?: string;
}

export function calculateMaterialCost(
  costPrice: number,
  packSize: number,
  usedQty: number
): number {
  if (packSize <= 0) return 0;
  const unitCost = costPrice / packSize;
  return Math.round(unitCost * usedQty * 100) / 100;
}

export function calculateNetIncome(
  totalPrice: number,
  totalMaterialCost: number
): number {
  return Math.round((totalPrice - totalMaterialCost) * 100) / 100;
}
