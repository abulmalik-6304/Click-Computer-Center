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
  allowance?: number; // 🆕 Allowance amount (separate from amount)
  salary?: number;    // 🆕 Salary amount (from Employee_TBL)
}

export interface ExpenseCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
}

// ✅ የተወሰኑ categories ብቻ
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    value: "house-expense",
    label: "የቤት ወጪ",
    icon: "🏠",
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    value: "social-expense",
    label: "የማህበራዊ ወጭ",
    icon: "🤝",
    color: "bg-pink-100 text-pink-700",
  },
  {
    value: "salary",
    label: "ደመወዝ",
    icon: "💰",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "transport",
    label: "ትራንስፖርት",
    icon: "🚗",
    color: "bg-teal-100 text-teal-700",
  },
  {
    value: "supplies",
    label: "📦 Supplies",
    icon: "📦",
    color: "bg-slate-100 text-slate-700",
  },
  {
    value: "bonus",
    label: "🎁 Bonus",
    icon: "🎁",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "allowance",
    label: "📋 Allowance",
    icon: "📋",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "rent",
    label: "🏠 Rent",
    icon: "🏠",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "utilities",
    label: "💡 Utilities",
    icon: "💡",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "maintenance",
    label: "🔧 Maintenance",
    icon: "🔧",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "other",
    label: "📝 Other",
    icon: "📝",
    color: "bg-gray-100 text-gray-700",
  },
];

// ✅ Helper functions
export function getCategoryLabel(value: string): string {
  const v = String(value || "").toLowerCase();
  return EXPENSE_CATEGORIES.find((c) => c.value === v)?.label || value || "—";
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

// ✅ Categories that REQUIRE Employee Info
export function requiresEmployeeInfo(category: string): boolean {
  const v = String(category || "").toLowerCase();
  return v === "salary" || v === "allowance";
}

// ✅ Categories that REQUIRE Payment Month
export function requiresPaymentMonth(category: string): boolean {
  const v = String(category || "").toLowerCase();
  return v === "salary";
}

// ✅ Payment month helpers
export function normalizePaymentMonth(input?: string | null): string {
  if (!input) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  try {
    if (/^\d{4}-\d{2}$/.test(input)) return input;
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 7);
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
  } catch {}
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ✅ Ethiopian month names
export const ETHIOPIAN_MONTHS = [
  { value: "01", label: "መስከረም", en: "Meskerem" },
  { value: "02", label: "ጥቅምት", en: "Tikimt" },
  { value: "03", label: "ኅዳር", en: "Hidar" },
  { value: "04", label: "ታኅሣሥ", en: "Tahsas" },
  { value: "05", label: "ጥር", en: "Tir" },
  { value: "06", label: "የካቲት", en: "Yekatit" },
  { value: "07", label: "መጋቢት", en: "Megabit" },
  { value: "08", label: "ሚያዝያ", en: "Miyazya" },
  { value: "09", label: "ግንቦት", en: "Ginbot" },
  { value: "10", label: "ሰኔ", en: "Sene" },
  { value: "11", label: "ሐምሌ", en: "Hamle" },
  { value: "12", label: "ነሐሴ", en: "Nehase" },
  { value: "13", label: "ጳጉሜ", en: "Pagume" },
];

// ✅ Gregorian month names (for reference/display)
export const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ✅ Format payment month — "January 2024"
export function formatPaymentMonth(value?: string | null): string {
  if (!value) return "—";
  try {
    const [year, month] = value.split("-");
    if (!year || !month) return value;
    const m = parseInt(month, 10);
    const gregMonth = GREGORIAN_MONTHS[m - 1] || month;
    return `${gregMonth} ${year}`;
  } catch {
    return value;
  }
}

// ✅ Format with Ethiopian month
export function formatPaymentMonthEth(value?: string | null): string {
  if (!value) return "—";
  try {
    const [year, month] = value.split("-");
    if (!year || !month) return value;
    const eth = ETHIOPIAN_MONTHS.find((m) => m.value === month);
    return eth ? `${eth.label} ${year}` : formatPaymentMonth(value);
  } catch {
    return value;
  }
}
