// src/lib/drive-url.ts
// ═══════════════════════════════════════════════════════════════
// 🖼 GOOGLE DRIVE URL CONVERTER
// Converts various Drive URL formats to direct CDN URLs
// ═══════════════════════════════════════════════════════════════

export function toDriveImageUrl(raw: string | undefined | null): string {
  if (!raw || !String(raw).trim()) return "/placeholder.svg";

  const str = String(raw).trim();
  if (str.startsWith("/")) return str;

  // ✅ Format 1: /d/FILE_ID/
  // ✅ Format 2: ?id=FILE_ID
  const match =
    str.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
    str.match(/[?&]id=([a-zA-Z0-9_-]{10,})/) ||
    str.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);

  if (match) {
    const fileId = match[1];
    // ✅ Use =w1000 for high-res + CDN delivery
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }

  // ✅ Already a direct URL
  if (str.startsWith("http")) return str;

  // ✅ Bare file ID (20+ chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    return `https://lh3.googleusercontent.com/d/${str}=w1000`;
  }

  return "/placeholder.svg";
}

// Aliases
export const formatDriveUrl = toDriveImageUrl;
export const getDriveImageUrl = toDriveImageUrl;
export const convertDriveUrl = toDriveImageUrl;
export default toDriveImageUrl;
