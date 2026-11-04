// src/lib/profit-sharing.ts
// ═══════════════════════════════════════════════════════════════
// 💵 PROFIT SHARING — History, split, and save functions
// ⚠️  This is SEPARATE from profit-engine.ts (which does calculation)
// ═══════════════════════════════════════════════════════════════

import { getSheet, getDoc } from "./google-sheets";
import { getCachedRows } from "./sheets-cache";

const PROFIT_SHARING_SHEET = "Profit_Sharing_TBL";
const SETTINGS_SHEET = "Settings_TBL";

export const PROFIT_SHARING_HEADERS = [
  "Sharing_ID",
  "Month",
  "Year",
  "Total_Revenue",
  "Total_Cost",
  "Total_Expenses",
  "Net_Profit",
  "Owner_Percent",
  "Manager_Percent",
  "Owner_Share",
  "Manager_Share",
  "Status",
  "Notes",
  "Created_By",
  "Created_At",
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
export interface ProfitSplit {
  ownerPercent: number;
  managerPercent: number;
}

export interface ProfitSharingRecord {
  id: string;
  month: number;
  year: number;
  totalRevenue: number;
  totalCost: number;
  totalExpenses: number;
  netProfit: number;
  ownerPercent: number;
  managerPercent: number;
  ownerShare: number;
  managerShare: number;
  status: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 💰 SPLIT CALCULATION
// ═══════════════════════════════════════════════════════════════
export function calculateSplit(
  netProfit: number,
  split: ProfitSplit
): { ownerShare: number; managerShare: number } {
  const ownerShare = round2((netProfit * split.ownerPercent) / 100);
  const managerShare = round2((netProfit * split.managerPercent) / 100);
  return { ownerShare, managerShare };
}

// ═══════════════════════════════════════════════════════════════
// 📖 DEFAULT SPLIT — stored in Settings_TBL
// ═══════════════════════════════════════════════════════════════
export async function getDefaultSplit(): Promise<ProfitSplit> {
  try {
    const sheet = await getSheet(SETTINGS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Setting_Key")) === "profit_split"
    );

    if (row) {
      const value = String(row.get("Setting_Value") || "");
      const [owner, manager] = value.split(",").map(Number);
      if (!isNaN(owner) && !isNaN(manager)) {
        return { ownerPercent: owner, managerPercent: manager };
      }
    }
    return { ownerPercent: 60, managerPercent: 40 };
  } catch {
    return { ownerPercent: 60, managerPercent: 40 };
  }
}

export async function setDefaultSplit(
  split: ProfitSplit,
  updatedBy: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (split.ownerPercent + split.managerPercent !== 100) {
      return { ok: false, error: "Percentages must total 100%" };
    }

    let sheet;
    try {
      sheet = await getSheet(SETTINGS_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SETTINGS_SHEET,
        headerValues: [
          "Setting_Key",
          "Setting_Value",
          "Updated_By",
          "Updated_At",
        ],
      });
    }

    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) => String(r.get("Setting_Key")) === "profit_split"
    );

    const value = `${split.ownerPercent},${split.managerPercent}`;

    if (existing) {
      existing.set("Setting_Value", value);
      existing.set("Updated_By", updatedBy);
      existing.set("Updated_At", new Date().toISOString());
      await existing.save();
    } else {
      await sheet.addRow({
        Setting_Key: "profit_split",
        Setting_Value: value,
        Updated_By: updatedBy,
        Updated_At: new Date().toISOString(),
      });
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 💾 SAVE SPLIT RECORD
// ═══════════════════════════════════════════════════════════════
export async function saveProfitSharingRecord(
  record: Omit<ProfitSharingRecord, "id" | "createdAt">,
  createdBy: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    let sheet;
    try {
      sheet = await getSheet(PROFIT_SHARING_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: PROFIT_SHARING_SHEET,
        headerValues: PROFIT_SHARING_HEADERS,
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `PS-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Sharing_ID: id,
      Month: record.month,
      Year: record.year,
      Total_Revenue: record.totalRevenue,
      Total_Cost: record.totalCost,
      Total_Expenses: record.totalExpenses,
      Net_Profit: record.netProfit,
      Owner_Percent: record.ownerPercent,
      Manager_Percent: record.managerPercent,
      Owner_Share: record.ownerShare,
      Manager_Share: record.managerShare,
      Status: record.status || "Finalized",
      Notes: record.notes || "",
      Created_By: createdBy,
      Created_At: new Date().toISOString(),
    });

    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 📜 HISTORY
// ═══════════════════════════════════════════════════════════════
export async function getProfitSharingHistory(): Promise<
  ProfitSharingRecord[]
> {
  try {
    const data = await getCachedRows(PROFIT_SHARING_SHEET);
    return data
      .map((obj) => ({
        id: String(obj.Sharing_ID || ""),
        month: Number(obj.Month || 0),
        year: Number(obj.Year || 0),
        totalRevenue: Number(obj.Total_Revenue || 0),
        totalCost: Number(obj.Total_Cost || 0),
        totalExpenses: Number(obj.Total_Expenses || 0),
        netProfit: Number(obj.Net_Profit || 0),
        ownerPercent: Number(obj.Owner_Percent || 0),
        managerPercent: Number(obj.Manager_Percent || 0),
        ownerShare: Number(obj.Owner_Share || 0),
        managerShare: Number(obj.Manager_Share || 0),
        status: String(obj.Status || ""),
        notes: String(obj.Notes || ""),
        createdBy: String(obj.Created_By || ""),
        createdAt: String(obj.Created_At || ""),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  } catch {
    return [];
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
