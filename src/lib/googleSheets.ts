import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

const jwt = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

export async function getSheet(title: string) {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[title];
  if (!sheet) throw new Error(`Sheet "${title}" not found`);
  return sheet;
}

export const SHEETS = {
  SALES: 'Sales',
  INVENTORY: 'Inventory',
  EXPENSES: 'Expenses',
  STAFF: 'Staff',
  TRAINING: 'Training_Registrations',
  SERVICES: 'Service_Requests',
  BADGES: 'Badges',
} as const;
