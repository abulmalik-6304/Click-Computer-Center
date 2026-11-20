// src/lib/inventory-helpers.ts

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  image: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  avgCost: number;
  unitType: string;
  reorderLevel: number;
  status: string;
  supplierId: string;
  date: string;
}

export type StockStatus = "in-stock" | "low" | "out";

export function getStockStatus(item: InventoryItem): StockStatus {
  const stock = Number(item.stock) || 0;
  const reorder = Number(item.reorderLevel) || 10;
  if (stock <= 0) return "out";
  if (stock <= reorder) return "low";
  return "in-stock";
}

export function getStockBadge(item: InventoryItem): {
  label: string;
  color: string;
  emoji: string;
} {
  const stock = Number(item.stock) || 0;
  const status = getStockStatus(item);
  if (status === "out") {
    return {
      label: "Out of stock",
      color: "bg-red-100 text-red-700",
      emoji: "🔴",
    };
  }
  if (status === "low") {
    return {
      label: `Only ${stock} left`,
      color: "bg-orange-100 text-orange-700",
      emoji: "🟡",
    };
  }
  return {
    label: `${stock} in stock`,
    color: "bg-emerald-100 text-emerald-700",
    emoji: "🟢",
  };
}

export function getProfitMargin(item: InventoryItem): number {
  const cost = Number(item.costPrice) || 0;
  const sell = Number(item.sellingPrice) || 0;
  if (cost <= 0) return 0;
  return Math.round(((sell - cost) / cost) * 1000) / 10;
}

export const UNIT_TYPES = [
  { value: "pcs", label: "Pcs — በነጠላ / በቁጥር" },
  { value: "set", label: "Set — በስብስብ / በኪት" },
  { value: "pack", label: "Pack — በፓኬት / በካርቶን" },
  { value: "meter", label: "Meter — በሜትር" },
] as const;

export const CATEGORY_OPTIONS = [
  "Computers",
  "Laptops",
  "Monitors",
  "Printers",
  "Accessories",
  "Networking",
  "Storage",
  "Printing Supplies",
  "Cables",
  "Other",
];
