// src/lib/supplier-customer-types.ts
// ═══════════════════════════════════════════════════════════════
// 🏭 SUPPLIERS + 🧑 CUSTOMERS — Shared Types
// ═══════════════════════════════════════════════════════════════

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  supplyItem: string;
  address: string;
  totalPurchases?: number;
  lastPurchase?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "Regular" | "VIP" | "Wholesale";
  email: string;
  address: string;
  recordedBy: string;
  totalPurchases?: number;
  totalAmount?: number;
  lastPurchase?: string;
  transactionCount?: number;
}

export interface CustomerStats {
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
  transactionCount: number;
}

export const CUSTOMER_TYPE_COLORS: Record<string, string> = {
  regular: "bg-slate-100 text-slate-700",
  vip: "bg-amber-100 text-amber-700",
  wholesale: "bg-emerald-100 text-emerald-700",
};

export const CUSTOMER_TYPE_ICONS: Record<string, string> = {
  regular: "👤",
  vip: "⭐",
  wholesale: "🏪",
};
