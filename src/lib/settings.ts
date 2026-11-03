// src/lib/settings.ts
import { getSheet, getDoc } from "./google-sheets";
import { ProfitConfig, DEFAULT_CONFIG } from "./profit-engine";

const SETTINGS_SHEET = "Settings_TBL";
const PROFIT_CONFIG_KEY = "profit_config";

export async function getProfitConfig(): Promise<ProfitConfig> {
  try {
    const sheet = await getSheet(SETTINGS_SHEET); // ✅ getSheet (not getCachedRows)
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Setting_Key")) === PROFIT_CONFIG_KEY
    );
    if (!row) return DEFAULT_CONFIG;

    const value = String(row.get("Setting_Value") || "");
    try {
      const parsed = JSON.parse(value);
      return {
        sharedExpenseCategories:
          parsed.sharedExpenseCategories || DEFAULT_CONFIG.sharedExpenseCategories,
        sharedDivisor: Number(parsed.sharedDivisor) || 3,
        staffSharePercent: Number(parsed.staffSharePercent) || 50,
        additionalStaff: Array.isArray(parsed.additionalStaff)
          ? parsed.additionalStaff
          : [],
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setProfitConfig(
  config: ProfitConfig,
  updatedBy: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    let sheet;
    try {
      sheet = await getSheet(SETTINGS_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SETTINGS_SHEET,
        headerValues: ["Setting_Key", "Setting_Value", "Updated_By", "Updated_At"],
      });
    }

    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) => String(r.get("Setting_Key")) === PROFIT_CONFIG_KEY
    );

    const value = JSON.stringify(config);

    if (existing) {
      existing.set("Setting_Value", value);
      existing.set("Updated_By", updatedBy);
      existing.set("Updated_At", new Date().toISOString());
      await existing.save();
    } else {
      await sheet.addRow({
        Setting_Key: PROFIT_CONFIG_KEY,
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
