// src/lib/expense-types.ts

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  recordedBy: string;
  employeeName: string;
  jobRole: string;
  paymentMonth: string;
}

export interface ExpenseCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
}

// ✅ ከ Expense_TBL ጋር የሚስማሙ categories
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    value: "salary",
    label: "Salary",
    icon: "💰",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "bonus",
    label: "Bonus",
    icon: "🎁",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "allowance",
    label: "Allowance",
    icon: "📋",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "overtime",
    label: "Overtime",
    icon: "⏰",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "advance",
    label: "Advance",
    icon: "💵",
    color: "bg-pink-100 text-pink-700",
  },
  {
    value: "rent",
    label: "Rent",
    icon: "🏠",
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    value: "utilities",
    label: "Utilities",
    icon: "💡",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "supplies",
    label: "Supplies",
    icon: "📦",
    color: "bg-slate-100 text-slate-700",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: "🔧",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "transport",
    label: "Transport",
    icon: "🚗",
    color: "bg-teal-100 text-teal-700",
  },
  {
    value: "other",
    label: "Other",
    icon: "📝",
    color: "bg-gray-100 text-gray-700",
  },
];

export function getCategoryLabel(value: string): string {
  const v = String(value || "").toLowerCase();
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === v)?.label || value || "—"
  );
}

export function getCategoryIcon(value: string): string {
  const v = String(value || "").toLowerCase();
  return EXPENSE_CATEGORIES.find((c) => c.value === v)?.icon || "📝";
}

export function getCategoryColor(value: string): string {
  const v = String(value || "").toLowerCase();
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === v)?.color ||
    "bg-gray-100 text-gray-700"
  );
}

// ✅ Payment month format helper (YYYY-MM)
export function normalizePaymentMonth(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 7);
  try {
    // Try YYYY-MM first
    if (/^\d{4}-\d{2}$/.test(input)) return input;
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 7);
    // Try Date parse
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    }
  } catch {}
  return new Date().toISOString().slice(0, 7);
}

// ✅ Format YYYY-MM → "January 2024"
export function formatPaymentMonth(value?: string | null): string {
  if (!value) return "—";
  try {
    const [year, month] = value.split("-");
    if (!year || !month) return value;
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}
