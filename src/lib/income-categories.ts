// src/lib/income-categories.ts
// ═══════════════════════════════════════════════════════════════
// 💰 INCOME CATEGORIES — Source → Category dependency map
// ═══════════════════════════════════════════════════════════════

export interface IncomeCategory {
  value: string;
  label: string;
}

export interface IncomeSource {
  value: string;
  label: string;
  icon: string;
  categories: IncomeCategory[];
}

export const INCOME_SOURCES: IncomeSource[] = [
  {
    value: "maintain",
    label: "ጥገና / Maintain",
    icon: "🔧",
    categories: [
      { value: "epson-printer", label: "EPSON ፕሪንተር" },
      { value: "canon-copy", label: "CANON COPY ማሽን" },
      { value: "pc", label: "PC" },
      { value: "desktop", label: "DESKTOP" },
      { value: "other-maintain", label: "Other" },
    ],
  },
  {
    value: "printing",
    label: "ሕትመት / Printing",
    icon: "🖨",
    categories: [
      { value: "national-id", label: "National ID" },
      { value: "banner", label: "ባነር" },
      { value: "sticker", label: "ስቲከር" },
      { value: "tshirt", label: "ቲሸርት" },
      { value: "stamp", label: "ማህተም" },
      { value: "magazine", label: "መፅሔት" },
      { value: "coupon", label: "ኩፖን" },
      { value: "invitation", label: "መጥሪያ ካርድ" },
      { value: "other-printing", label: "Other" },
    ],
  },
  {
    value: "service",
    label: "አገልግሎት / Service",
    icon: "💼",
    categories: [
      { value: "trade-license", label: "ንግድ ፈቃድ እድሳት" },
      { value: "passport", label: "የፓስፖርት አገልግሎት" },
      { value: "attachment-email", label: "አታችመንት/ኢሜል" },
      { value: "other-service", label: "Other" },
    ],
  },
  {
    value: "3c-shop",
    label: "3C Shop",
    icon: "🏪",
    categories: [
      { value: "shop-general", label: "የሱቁ የተለየ ገቢ" },
      { value: "shop-sale", label: "የሱቅ ሽያጭ" },
      { value: "other-shop", label: "Other" },
    ],
  },
];

// ─── Helper functions ───

export function getSourceLabel(value: string): string {
  const src = INCOME_SOURCES.find(
    (s) => s.value === value.toLowerCase() || s.label === value
  );
  return src?.label || value;
}

export function getSourceIcon(value: string): string {
  const src = INCOME_SOURCES.find(
    (s) => s.value === value.toLowerCase() || s.label === value
  );
  return src?.icon || "💰";
}

export function getCategoriesForSource(sourceValue: string): IncomeCategory[] {
  const src = INCOME_SOURCES.find(
    (s) => s.value === sourceValue.toLowerCase() || s.label === sourceValue
  );
  return src?.categories || [];
}

export function getCategoryLabel(
  sourceValue: string,
  categoryValue: string
): string {
  const cats = getCategoriesForSource(sourceValue);
  const cat = cats.find(
    (c) => c.value === categoryValue.toLowerCase() || c.label === categoryValue
  );
  return cat?.label || categoryValue;
}

// ─── Colors ───

export const SOURCE_COLORS: Record<string, string> = {
  maintain: "bg-blue-100 text-blue-700",
  printing: "bg-purple-100 text-purple-700",
  service: "bg-emerald-100 text-emerald-700",
  "3c-shop": "bg-orange-100 text-orange-700",
};

// ─── Breakdown by source (for stats) ───

export interface IncomeBreakdown {
  source: string;
  sourceLabel: string;
  icon: string;
  total: number;
  count: number;
}

export function buildSourceBreakdown(
  items: { incomeSource: string; totalPrice: number }[]
): IncomeBreakdown[] {
  const map: Record<string, IncomeBreakdown> = {};
  for (const item of items) {
    const key = item.incomeSource.toLowerCase();
    if (!map[key]) {
      map[key] = {
        source: key,
        sourceLabel: getSourceLabel(key),
        icon: getSourceIcon(key),
        total: 0,
        count: 0,
      };
    }
    map[key].total += item.totalPrice;
    map[key].count++;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}
