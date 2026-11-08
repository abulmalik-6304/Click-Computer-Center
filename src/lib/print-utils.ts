// src/lib/print-utils.ts

export function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export function escapeHtml(s: any): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface PrintOptions {
  title: string;
  subtitle?: string;
  bodyHtml: string;
}

export function printHTML({ title, subtitle, bodyHtml }: PrintOptions) {
  const html = `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; max-width: 900px; margin: 0 auto; color: #0f172a; }
          h1 { font-size: 22px; margin: 0 0 4px; color: #065f46; }
          .subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
          h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 2px solid #10b981; padding-bottom: 3px; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin: 8px 0 16px; }
          .info div { padding: 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
          th, td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          tfoot tr { font-weight: bold; background: #f0fdf4; }
          .kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
          .kpi div { padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center; }
          .kpi .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .kpi .value { font-size: 15px; font-weight: bold; margin-top: 4px; }
          .footer { margin-top: 32px; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; }
          .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; font-size: 12px; }
          .signature div { border-top: 1px solid #94a3b8; padding-top: 6px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Click Computer Center</h1>
        <div class="subtitle">${escapeHtml(title)}${
    subtitle ? " · " + escapeHtml(subtitle) : ""
  } · ${new Date().toLocaleString()}</div>
        ${bodyHtml}
        <p class="footer">Click Computer Center · Confidential · Generated ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `;

  const w = window.open("", "_blank", "width=950,height=800");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export async function shareText(
  title: string,
  text: string
): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch {
      return "failed";
    }
  }
  const ok = await copyToClipboard(text);
  return ok ? "copied" : "failed";
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
