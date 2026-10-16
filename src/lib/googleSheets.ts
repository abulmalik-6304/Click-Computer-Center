import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// የጎግል አውተንቲኬሽን ማዘጋጃ
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// ከተፈለገው ቴብል (Sheet) ላይ መረጃዎችን የሚያመጣ ተግባር
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

// ✅ አዲስ የተጨመረው Helper
// የ Google Drive ሊንክን ወደ ሚታይ ምስል መቀየሪያ Helper
export const getDirectDriveImage = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=s1000`;
    }
  }
  return url;
};
