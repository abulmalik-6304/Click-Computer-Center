// src/lib/drive-url.ts

/**
 * Convert any Google Drive share link into a direct CDN URL
 * that can be rendered in <img src="...">.
 *
 * Accepts:
 *   - https://drive.google.com/file/d/FILE_ID/view
 *   - https://drive.google.com/open?id=FILE_ID
 *   - https://lh3.googleusercontent.com/d/FILE_ID
 *   - plain FILE_ID
 *
 * Returns:
 *   - https://lh3.googleusercontent.com/d/FILE_ID=w1000
 *   - or the original URL if already valid
 *   - or "/placeholder.svg" if empty/invalid
 */
export function toDriveImageUrl(raw: string | undefined | null): string {
  if (!raw || !String(raw).trim()) return "/placeholder.svg";

  const str = String(raw).trim();
  if (str.startsWith("/")) return str;

  const match =
    str.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
    str.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);

  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=w1000`;
  }

  if (str.startsWith("http")) return str;

  // Assume raw is a bare file ID (e.g. 1a2b3c4d5e6f...)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    return `https://lh3.googleusercontent.com/d/${str}=w1000`;
  }

  return "/placeholder.svg";
}

// ═══════════════════════════════════════════════════════════════
// ✅ BACKWARD-COMPATIBLE ALIASES
// Existing code uses these names. All map to toDriveImageUrl().
// ═══════════════════════════════════════════════════════════════
export const formatDriveUrl = toDriveImageUrl;
export const getDriveImageUrl = toDriveImageUrl;
export const convertDriveUrl = toDriveImageUrl;
export const driveImageUrl = toDriveImageUrl;

// ✅ Default export too
export default toDriveImageUrl;
