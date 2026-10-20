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

// 1. Google Spreadsheet Document ን የሚጭን ፊንክሽን
export async function getDoc() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID environment variable");
  const doc = new GoogleSpreadsheet(sheetId, getJwt());
  await doc.loadInfo();
  return doc;
}

// 2. የተወሰነውን ሺት በስም ለይቶ የሚያመጣ ፊንክሽን
export async function getSheet(title: string) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[title];
  if (!sheet) throw new Error(`Sheet "${title}" not found`);
  return sheet;
}

// 3. የሁሉም ሺቶቻችን የቴብል ስሞች
export const SHEETS = {
  SALES: "Sales",
  INVENTORY: "Inventory",
  EXPENSES: "Expenses",
  STAFF: "Staff",
  TRAINING: "Training_Registrations",
  SERVICES: "Service_Requests",
  BADGES: "Badges",
  CUSTOMERS: "Customers",
  SUPPLIERS: "Suppliers",
  USERS: "Users",
} as const;

// 4. ከሺቱ ላይ ዳታዎችን ማንበብ (GET Data)
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

// 5. ወደ ሺቱ አዲስ ዳታ ጽፎ መጨመር (POST / Append Data)
export async function appendRowToTable(title: string, rowData: Record<string, any>) {
  try {
    const sheet = await getSheet(title);
    await sheet.addRow(rowData);
    return { success: true };
  } catch (error: any) {
    console.error(`Error appending row to sheet "${title}":`, error);
    return { success: false, error: error.message };
  }
}
