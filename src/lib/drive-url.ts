// src/lib/drive-url.ts

/**
 * ✅ PRIMARY export — used by new code
 * Accepts any Google Drive share link and returns the CDN URL
 */
export function toDriveImageUrl(raw: string | undefined | null): string {
  if (!raw || !raw.trim()) return "/placeholder.png";
  if (raw.startsWith("/")) return raw;

  const match =
    raw.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
    raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=w1000`;
  return raw.startsWith("http") ? raw : "/placeholder.png";
}

/**
 * ✅ ALIAS export — for older code that imports `formatDriveUrl`
 * Kept for backward compatibility. Same behavior as toDriveImageUrl.
 */
export const formatDriveUrl = toDriveImageUrl;

/**
 * ✅ ALSO alias for any code using `getDriveImageUrl`
 */
export const getDriveImageUrl = toDriveImageUrl;

/**
 * Default export for `import formatDriveUrl from "@/lib/drive-url"`
 */
export default toDriveImageUrl;
