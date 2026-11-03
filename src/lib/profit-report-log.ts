// src/lib/profit-report-log.ts
// ═══════════════════════════════════════════════════════════════
// 📝 PROFIT REPORT LOG — tracks who printed/copied reports
// ═══════════════════════════════════════════════════════════════

import { getSheet, getDoc } from "./google-sheets";

const LOG_SHEET = "Profit_Report_Log_TBL";

export const LOG_HEADERS = [
  "Log_ID",
  "Date",
  "Action",
  "Month",
  "Year",
  "Performed_By",
  "Performed_Email",
  "Role",
  "Total_Income",
  "Net_Profit",
  "Owner_Profit",
  "Staff_Profit",
];

export interface ReportLogEntry {
  id: string;
  date: string;
  action: string; // "print" | "copy" | "export"
  month: number;
  year: number;
  performedBy: string;
  performedEmail: string;
  role: string;
  totalIncome: number;
  netProfit: number;
  ownerProfit: number;
  staffProfit: number;
}

export async function logReportAction(
  entry: Omit<ReportLogEntry, "id" | "date">
): Promise<{ ok: boolean; error?: string }> {
  try {
    let sheet;
    try {
      sheet = await getSheet(LOG_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: LOG_SHEET,
        headerValues: LOG_HEADERS,
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;

    await sheet.addRow({
      Log_ID: `RPT-${String(nextNum).padStart(5, "0")}`,
      Date: new Date().toISOString(),
      Action: entry.action,
      Month: entry.month,
      Year: entry.year,
      Performed_By: entry.performedBy,
      Performed_Email: entry.performedEmail,
      Role: entry.role,
      Total_Income: entry.totalIncome,
      Net_Profit: entry.netProfit,
      Owner_Profit: entry.ownerProfit,
      Staff_Profit: entry.staffProfit,
    });

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function getReportLog(
  limit = 100
): Promise<ReportLogEntry[]> {
  try {
    const sheet = await getSheet(LOG_SHEET);
    const rows = await sheet.getRows();
    return rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Log_ID || ""),
          date: String(obj.Date || ""),
          action: String(obj.Action || ""),
          month: Number(obj.Month || 0),
          year: Number(obj.Year || 0),
          performedBy: String(obj.Performed_By || ""),
          performedEmail: String(obj.Performed_Email || ""),
          role: String(obj.Role || ""),
          totalIncome: Number(obj.Total_Income || 0),
          netProfit: Number(obj.Net_Profit || 0),
          ownerProfit: Number(obj.Owner_Profit || 0),
          staffProfit: Number(obj.Staff_Profit || 0),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}
