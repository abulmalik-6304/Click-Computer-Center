// src/lib/expense-categories.ts
// ═══════════════════════════════════════════════════════════════
// 💸 EXPENSE CATEGORIES — fixed list matching your Google Sheet
// ═══════════════════════════════════════════════════════════════

export const EXPENSE_CATEGORIES = [
  { value: "transport", label: "ትራንስፖርት", icon: "🚗" },
  { value: "social", label: "የማህበራዊ ወጪ", icon: "🤝" },
  { value: "home", label: "የቤት ወጪ", icon: "🏠" },
  { value: "salary", label: "ደመወዝ", icon: "💰" },
  { value: "business", label: "የድርጅቱ ወጪ", icon: "🏢" },
  { value: "other", label: "ሌላ", icon: "📌" },
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string): string {
  const cat = EXPENSE_CATEGORIES.find(
    (c) => c.value === value.toLowerCase() || c.label === value
  );
  return cat?.label || value;
}

export function getCategoryIcon(value: string): string {
  const cat = EXPENSE_CATEGORIES.find(
    (c) => c.value === value.toLowerCase() || c.label === value
  );
  return cat?.icon || "💸";
}

export const EXPENSE_COLORS: Record<string, string> = {
  transport: "bg-blue-100 text-blue-700",
  social: "bg-purple-100 text-purple-700",
  home: "bg-orange-100 text-orange-700",
  salary: "bg-emerald-100 text-emerald-700",
  business: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-700",
};
