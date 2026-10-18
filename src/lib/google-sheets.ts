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
    throw new Error("Missing Google service account env vars");
  }
  cachedJwt = new JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  return cachedJwt;
}

export async function getSheet(title: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID env var");
  const doc = new GoogleSpreadsheet(sheetId, getJwt());
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[title];
  if (!sheet) throw new Error(`Sheet "${title}" not found`);
  return sheet;
}

export const SHEETS = {
  SALES: "Sales",
  INVENTORY: "Inventory",
  EXPENSES: "Expenses",
  STAFF: "Staff",
  TRAINING: "Training_Registrations",
  SERVICES: "Service_Requests",
  BADGES: "Badges",
} as const;

export async function getTableData(title: string) {
  const sheet = await getSheet(title);
  const rows = await sheet.getRows();
  return rows.map((r) => r.toObject());
}
