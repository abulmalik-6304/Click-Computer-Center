export function resolveGoogleDriveImage(url?: string): string {
  if (!url) return '/logo.png';
  
  // If it's already a standard http/local url or relative path
  if (url.startsWith('/') || url.startsWith('blob:')) return url;

  // Google Drive File ID Extraction
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  return url;
}
