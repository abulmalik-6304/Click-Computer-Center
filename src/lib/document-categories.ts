// src/lib/document-categories.ts

export interface DocumentCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    value: "license",
    label: "Business License",
    icon: "📜",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "tax",
    label: "Tax Payment",
    icon: "💰",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "utilities",
    label: "Utilities (Water/Electric)",
    icon: "💡",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "contract",
    label: "Contract / Agreement",
    icon: "📝",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "receipt",
    label: "Receipt / Invoice",
    icon: "🧾",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "report",
    label: "Report",
    icon: "📊",
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    value: "certificate",
    label: "Certificate",
    icon: "🏆",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "other",
    label: "Other",
    icon: "📎",
    color: "bg-gray-100 text-gray-700",
  },
];

export function getCategoryLabel(value: string): string {
  const cat = DOCUMENT_CATEGORIES.find((c) => c.value === value);
  return cat?.label || value || "Other";
}

export function getCategoryIcon(value: string): string {
  const cat = DOCUMENT_CATEGORIES.find((c) => c.value === value);
  return cat?.icon || "📎";
}

export function getCategoryColor(value: string): string {
  const cat = DOCUMENT_CATEGORIES.find((c) => c.value === value);
  return cat?.color || "bg-gray-100 text-gray-700";
}
