import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

let cachedJwt: JWT | null = null;

function getJwt(): JWT {
  if (cachedJwt) return cachedJwt;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error("Missing Google service account environment variables");
  }
  cachedJwt = new JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  return cachedJwt;
}

export async function getDoc() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID environment variable");
  const doc = new GoogleSpreadsheet(sheetId, getJwt());
  await doc.loadInfo();
  return doc;
}

export async function getSheet(title: string) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[title];
  if (!sheet) throw new Error(`Sheet "${title}" not found`);
  return sheet;
}

// ═══════════════════════════════════════════════════════════════
// ✅ የእውነተኛ Sheet ስሞች (ከGoogle Sheet ጋር ይገጥማሉ)
// ═══════════════════════════════════════════════════════════════
export const SHEETS = {
  INVENTORY: "Inventory_TBL",
  STOCK_IN: "Stock_In_TBL",
  SALES: "Sales_TBL",
  SALES_ITEMS: "Sales_Items_TBL",
  INCOME: "Income_TBL",
  PAYMENTS: "Payments_TBL",
  USERS: "User_Access_TBL",
  EXPENSES: "Expense_TBL",
  EMPLOYEES: "Employee_TBL",
  CUSTOMERS: "Customer_TBL",
  SUPPLIERS: "Supplier_TBL",
  ANNOUNCEMENTS: "Announcements_TBL",
} as const;

// ─── አጋዥ ፋንክሽኖች ───

export async function getTableData(title: string) {
  try {
    const sheet = await getSheet(title);
    const rows = await sheet.getRows();
    return rows.map((r) => r.toObject());
  } catch (error) {
    console.error(`Error fetching data from sheet "${title}":`, error);
    return [];
  }
}

export async function appendRowToTable(
  title: string,
  rowData: Record<string, any>
) {
  try {
    const sheet = await getSheet(title);
    await sheet.addRow(rowData);
    return { success: true };
  } catch (error: any) {
    console.error(`Error appending row to sheet "${title}":`, error);
    return { success: false, error: error.message };
  }
}

// የረድፍ መጠን በመጠቀም መፈለግ (ለማረም/መሰረዝ)
export async function findRowById(title: string, idColumn: string, id: string) {
  const sheet = await getSheet(title);
  const rows = await sheet.getRows();
  return rows.find((r) => String(r.get(idColumn)) === String(id)) || null;
}
