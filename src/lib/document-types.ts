// src/lib/document-types.ts

export interface DocumentRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  fileKey: string;
  fileType: string; // "pdf" | "image"
  fileSize: number;
  issueDate: string;
  expiryDate: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string;
  status: "active" | "archived";
}

export interface DocumentForm {
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  issueDate: string;
  expiryDate: string;
  tags: string;
}

export function isExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  try {
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return false;
    return exp < new Date();
  } catch {
    return false;
  }
}

export function isExpiringSoon(expiryDate: string, days = 30): boolean {
  if (!expiryDate) return false;
  try {
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return false;
    const diff = exp.getTime() - Date.now();
    return diff > 0 && diff < days * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
