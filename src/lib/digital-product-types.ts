// src/lib/digital-product-types.ts

export interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnailImage: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  showOnWeb: boolean;
  featured: boolean;
  downloadLimit: number;
  createdBy: string;
  createdAt: string;
  status: "active" | "archived";
}

export interface DigitalOrder {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: string;
  paymentReference: string;
  paymentAmount: number;
  downloadToken: string;
  downloadCount: number;
  downloadLimit: number;
  status: "pending" | "approved" | "rejected";
  notes: string;
  createdAt: string;
  approvedAt: string;
  approvedBy: string;
}

export const DIGITAL_CATEGORIES = [
  { value: "ebook", label: "E-Book", icon: "📚" },
  { value: "template", label: "Template", icon: "🎨" },
  { value: "software", label: "Software", icon: "💻" },
  { value: "course", label: "Course", icon: "🎓" },
  { value: "other", label: "Other", icon: "📦" },
] as const;

export function getDigitalCategoryLabel(value: string): string {
  const cat = DIGITAL_CATEGORIES.find((c) => c.value === value);
  return cat?.label || value || "Other";
}

export function getDigitalCategoryIcon(value: string): string {
  const cat = DIGITAL_CATEGORIES.find((c) => c.value === value);
  return cat?.icon || "📦";
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
