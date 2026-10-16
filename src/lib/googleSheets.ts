import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// የጎግል አውተንቲኬሽን ማዘጋጃ (ለማንበብ እና ለመጻፍ የሚያስችል full spreadsheets scope)
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// 1. ከተፈለገው ቴብል (Sheet) ላይ መረጃዎችን የሚያመጣ ተግባር (GET)
export async function getTableData(sheetTitle: string) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      console.error(`Sheet with title "${sheetTitle}" not found.`);
      return [];
    }

    const rows = await sheet.getRows();
    return rows.map((row) => row.toObject());
  } catch (error) {
    console.error(`Error fetching sheet ${sheetTitle}:`, error);
    return [];
  }
}

// 2. ወደ ጎግል ሺት አዲስ ረድፍ (Row) የሚጨምር ተግባር (POST / Append)
export async function appendRowToTable(sheetTitle: string, rowData: Record<string, any>) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      throw new Error(`Sheet with title "${sheetTitle}" not found.`);
    }

    // መረጃውን ወደ ሺቱ መጨመር
    await sheet.addRow(rowData);
    return { success: true };
  } catch (error: any) {
    console.error(`Error appending to sheet ${sheetTitle}:`, error);
    return { success: false, error: error.message };
  }
}
