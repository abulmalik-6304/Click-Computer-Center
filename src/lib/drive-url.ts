// ═══════════════════════════════════════════════════════════════
// 🔗 GOOGLE DRIVE URL FORMATTER HELPER
// ═══════════════════════════════════════════════════════════════

export function toDriveImageUrl(raw: string | undefined | null): string {
  if (!raw) return "/placeholder.png";
  const match =
    raw.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
    raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=w1000`;
  return raw.startsWith("http") ? raw : "/placeholder.png";
}

// Backwards compatibility for any file importing formatDriveUrl
export function formatDriveUrl(raw: string | undefined | null): string {
  return toDriveImageUrl(raw);
}
