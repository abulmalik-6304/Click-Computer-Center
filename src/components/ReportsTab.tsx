'use client';

import { useState } from 'react';
import { 
  FileText, 
  Printer, 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  Boxes, 
  FileSpreadsheet,
  PieChart,
  DollarSign,
  ChevronRight,
  X,
  Store,
  Search,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { UserRole } from '../types';

interface ReportsTabProps {
  sales: any[];
  income: any[];
  expenses: any[];
  inventory: any[];
  salesItemsList?: any[];
  users: any[];
  currentUserRole: UserRole;
  currentUserEmail: string;
}

export default function ReportsTab({
  sales = [],
  income = [],
  expenses = [],
  inventory = [],
  salesItemsList = [],
  users = [],
  currentUserRole,
  currentUserEmail,
}: ReportsTabProps) {
  const [activeReportCard, setActiveReportCard] = useState<'hub' | 'master' | 'sales' | 'expenses' | 'income' | 'inventory' | 'profit'>('hub');
  
  // Date & Search States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  
  // Receipt Modal State & Format Selector ('pos' or 'a5')
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<any | null>(null);
  const [receiptType, setReceiptType] = useState<'pos' | 'a5'>('a5');

  const isOwnerOrManager = currentUserRole === 'Owner' || currentUserRole === 'Manager';

  // ============================================================
  // 🔧 DATE NORMALIZATION - Handles MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
  // ============================================================
  const normalizeDate = (rawDate?: string) => {
    if (!rawDate) return '';
    const str = String(rawDate).trim().slice(0, 10);
    
    // Check if format is MM/DD/YYYY or M/D/YYYY (e.g., 07/15/2026 or 7/15/2026)
    if (str.includes('/') && str.split('/')[2]?.length === 4) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Check if format is DD-MM-YYYY (e.g., 15-07-2026) - in case of dash format
    if (str.includes('-') && str.split('-')[0]?.length <= 2) {
      const parts = str.split('-');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        if (year.length === 4) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    return str; // Already YYYY-MM-DD format
  };

  // ============================================================
  // 🔍 FILTER BY DATE RANGE + SEARCH
  // ============================================================
  const filterByDateAndSearch = (item: any, dateField: string, searchFields: string[]) => {
    const rawDate = item[dateField] || item.Date || item.Timestamp;
    
    if (startDate || endDate) {
      if (!rawDate) return false;
      const normalizedItemDate = normalizeDate(rawDate);
      
      if (startDate && normalizedItemDate < startDate) return false;
      if (endDate && normalizedItemDate > endDate) return false;
    }

    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const matches = searchFields.some((field) => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(query);
      });
      if (!matches) return false;
    }

    return true;
  };

  const filteredSales = sales.filter((s) => filterByDateAndSearch(s, 'Date', ['Invoice_No', 'Customer_Name', 'Payment_Method', 'Recorded_By', 'Sales_ID']));
  const filteredIncome = income.filter((i) => {
    const matchesBase = filterByDateAndSearch(i, 'Date', ['Income_ID', 'Income_Source', 'Income_Category', 'Description', 'Recorded_By']);
    if (!matchesBase) return false;
    if (selectedCategoryFilter !== 'All') {
      const src = i.Income_Source || i.Income_Category || '';
      return src.toLowerCase() === selectedCategoryFilter.toLowerCase();
    }
    return true;
  });
  const filteredExpenses = expenses.filter((e) => {
    const matchesBase = filterByDateAndSearch(e, 'Date', ['Expense_ID', 'Category', 'Expense_Type', 'Description', 'Recorded_By']);
    if (!matchesBase) return false;
    if (selectedCategoryFilter !== 'All') {
      const cat = e.Category || e.Expense_Type || '';
      return cat.toLowerCase() === selectedCategoryFilter.toLowerCase();
    }
    return true;
  });
  const filteredInventory = inventory.filter((item) => filterByDateAndSearch(item, 'Date', ['Item_Code', 'Item_Name', 'Supplier_ID', 'Recorded_By']));

  // Calculations
  const totalSalesVal = filteredSales.reduce((a, c) => a + parseFloat(String(c.Total_Amount || c.Total_Price || 0)), 0);
  const totalSalesCostVal = filteredSales.reduce((a, c) => a + parseFloat(String(c.Total_Cost_Amount || 0)), 0);
  const netSalesProfit = totalSalesVal - totalSalesCostVal;

  const totalOtherIncomeVal = filteredIncome.reduce((a, c) => a + parseFloat(String(c.Total_Price || c.Price || 0)), 0);
  const totalExpensesVal = filteredExpenses.reduce((a, c) => a + parseFloat(String(c.Amount || 0)), 0);

  const totalIncome = totalSalesVal + totalOtherIncomeVal;
  const materialCost = filteredIncome.reduce((a, c) => a + parseFloat(String(c.Material_Cost || 0)), 0);
  const totalCost = totalSalesCostVal + materialCost;
  const balance = totalIncome - totalExpensesVal;

  const staffSharedExpenses = filteredExpenses
    .filter((e) => {
      const cat = (e.Category || e.Description || e.Expense_Type || '').toLowerCase();
      return cat.includes('ቤት') || cat.includes('home');
    })
    .reduce((a, c) => a + parseFloat(String(c.Amount || 0)), 0);

  const staffProfit = Math.max(0, (totalIncome - totalExpensesVal - totalCost - (staffSharedExpenses / 3)) / 2);
  const ownerProfit = totalIncome - totalExpensesVal - staffProfit;

  // Export to CSV
  const exportToExcel = (dataArray: any[], filename: string) => {
    if (!dataArray || dataArray.length === 0) {
      alert('ሊወጣ የሚችል ምንም ዳታ አልተገኘም!');
      return;
    }
    const headers = Object.keys(dataArray[0]);
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += headers.join(",") + "\r\n";
    dataArray.forEach((row) => {
      const rowValues = headers.map((header) => {
        const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvContent += rowValues.join(",") + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Function
  const handlePrint = (elementId: string, title: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    const win = window.open('', '', 'width=950,height=750');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${title} - CLICK COMPUTER CENTER</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 35px; color: #0f172a; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 26px; color: #0f172a; font-weight: 900; }
            .header p { margin: 6px 0 0 0; font-size: 14px; font-weight: bold; color: #2563eb; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; font-weight: bold; background: #f8fafc; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 11px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
            img { max-width: 45px; max-height: 45px; object-fit: cover; border-radius: 6px; }
            .footer-note { margin-top: 25px; font-size: 11px; color: #475569; background: #fdf4f0; padding: 12px; border-left: 4px solid #ea580c; border-radius: 6px; }
            .signature-area { margin-top: 60px; display: flex; justify-content: space-between; padding-top: 20px; }
            .sig-box { text-align: center; width: 40%; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ክሊክ ኮምፒዉተር ሴንተር (CLICK COMPUTER CENTER)</h1>
            <p>${title}</p>
          </div>
          <div class="meta">
            <span>የሪፖርት መለያ (ID): CCC-REP-${Math.floor(1000 + Math.random() * 9000)}</span>
            <span>ከቀን: ${startDate || 'መጀመሪያ'} | እስከ ቀን: ${endDate || 'ዛሬ'}</span>
            <span>የተዘጋጀበት ቀን: ${new Date().toLocaleDateString('am-ET')}</span>
          </div>
          ${printContent.innerHTML}
          <div class="signature-area">
            <div class="sig-box">
              <p>_________________________</p>
              <p style="margin-top:5px;">የሪፖርቱ አቅራቢ (Manager)</p>
            </div>
            <div class="sig-box">
              <p>_________________________</p>
              <p style="margin-top:5px;">የድርጅቱ ባለቤት (Owner)</p>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const reportCards = [
    { id: 'master', title: 'ማስተር ማጠቃለያ (Master Summary)', desc: 'አጠቃላይ የሱቁን ገቢ፣ ወጪ፣ የሽያጭ ትርፍና የተጣራ ካሽ ማጠቃለያ', icon: PieChart, color: 'bg-purple-600' },
    { id: 'sales', title: 'የሽያጭ ሪፖርት (Sales Report)', desc: `የተሸጡ እቃዎች እና የሽያጭ አፈፃፀም ዝርዝር (${sales.length} መዝገቦች)`, icon: ShoppingCart, color: 'bg-emerald-600' },
    { id: 'expenses', title: 'የወጪዎች ሪፖርት (Expense Report)', desc: `የሱቅ ኪራይ፣ ደሞዝ እና ሌሎች ወጪዎች ዝርዝር (${expenses.length} መዝገቦች)`, icon: Receipt, color: 'bg-rose-600' },
    { id: 'income', title: 'የገቢዎች ሪፖርት (Income Report)', desc: `የጥገና፣ የስልጠና እና ሌሎች ገቢዎች ዝርዝር (${income.length} መዝገቦች)`, icon: TrendingUp, color: 'bg-blue-600' },
    { id: 'inventory', title: 'የስቶክ ሪፖርት (Inventory Report)', desc: `አጠቃላይ በስቶክ ውስጥ ያሉ እቃዎች ዝርዝር (${inventory.length} እቃዎች)`, icon: Boxes, color: 'bg-amber-600' },
    { id: 'profit', title: 'Profit / የትርፍ ክፍፍል ሪፖርት', desc: 'ኦፊሴላዊ የትርፍ ክፍፍል ሪፖርት ከሙሉ የደብዳቤ ፎርማት እና ፊርማ ጋር', icon: DollarSign, color: 'bg-indigo-600' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Store className="w-7 h-7 text-orange-600" /> ክሊክ ኮምፒዉተር ሴንተር - የሪፖርት ማዕከል
          </h2>
          <p className="text-xs text-slate-500 mt-1">የሚፈልጉትን የሪፖርት ካርድ በመምረጥ በሰርች እና ፊልተር አጣርተው ይመልከቱ</p>
        </div>

        {activeReportCard !== 'hub' && (
          <button
            onClick={() => { setActiveReportCard('hub'); setSearchTerm(''); setStartDate(''); setEndDate(''); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition cursor-pointer"
          >
            ← ወደ ሪፖርት ካርዶች ተመለስ
          </button>
        )}
      </div>

      {/* HUB CARDS VIEW */}
      {activeReportCard === 'hub' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveReportCard(card.id as any)}
                className="bg-white border border-slate-200 hover:border-orange-500 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 ${card.color} text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition" />
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base group-hover:text-orange-600 transition">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                </div>

                <div className="pt-3 border-t text-xs font-black text-orange-600 flex items-center justify-between">
                  <span>ሪፖርቱን ክፈት</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEARCH, FILTER & DATE BAR */}
      {activeReportCard !== 'hub' && (
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
            
            {/* Search Input */}
            <div className="relative">
              <label className="block text-slate-500 mb-1 uppercase">ፈልግ (Search)</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="በInvoice, ID, ስም ፈልግ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-slate-500 mb-1 uppercase">ከቀን (Start Date)</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-slate-500 mb-1 uppercase">እስከ ቀን (End Date)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); setSelectedCategoryFilter('All'); }} className="w-full p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition">
                ማጣሪያዎችን አጽዳ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SALES REPORT TAB */}
      {activeReportCard === 'sales' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" /> የሽያጭ ሪፖርት ዝርዝር ({filteredSales.length})
            </h3>
            <div className="flex gap-2">
              <button onClick={() => exportToExcel(filteredSales, 'Sales_Report')} className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => handlePrint('sales-print-area', 'የሽያጭ ሪፖርት')} className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          <div id="sales-print-area" className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3">Sales ID</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">ቀን</th>
                  <th className="p-3">ደንበኛ</th>
                  <th className="p-3">አከፋፈል</th>
                  <th className="p-3">ጠቅላላ ሂሳብ</th>
                  <th className="p-3">የመዘገበው</th>
                  <th className="p-3">ደረሰኝ (Receipt)</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={8} className="p-4 text-center text-slate-400 italic">ምንም የሽያጭ መዝገብ አልተገኘም።</td></tr>
                ) : (
                  filteredSales.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-indigo-600">{s.Sales_ID || `S-${idx+1}`}</td>
                      <td className="p-3 font-bold text-blue-600">{s.Invoice_No || 'N/A'}</td>
                      <td className="p-3">{s.Date || 'N/A'}</td>
                      <td className="p-3 font-bold">{s.Customer_Name || 'Walk-in'}</td>
                      <td className="p-3">{s.Payment_Method || 'Cash'}</td>
                      <td className="p-3 font-black text-emerald-600">{parseFloat(String(s.Total_Amount || s.Total_Price || 0)).toLocaleString()} ብር</td>
                      <td className="p-3 text-slate-500">{s.Recorded_By || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedReceiptSale(s)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 cursor-pointer text-[11px]"
                        >
                          📄 ደረሰኝ አውጣ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSES REPORT TAB */}
      {activeReportCard === 'expenses' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" /> የወጪዎች ሪፖርት ዝርዝር ({filteredExpenses.length})
            </h3>
            <button onClick={() => handlePrint('expenses-print-area', 'የወጪ ሪፖርት')} className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          <div id="expenses-print-area" className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr><th className="p-3">Expense ID</th><th className="p-3">ቀን</th><th className="p-3">ምክንያት (Category)</th><th className="p-3">መግለጫ</th><th className="p-3">መጠን (Amount)</th><th className="p-3">የመዘገበው</th></tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredExpenses.map((e, i) => (
                  <tr key={i}><td className="p-3 font-bold text-blue-600">{e.Expense_ID || `EXP-${i+1}`}</td><td className="p-3">{e.Date}</td><td className="p-3 font-bold">{e.Category || e.Expense_Type}</td><td className="p-3">{e.Description || '-'}</td><td className="p-3 font-black text-rose-600">{parseFloat(e.Amount || 0).toLocaleString()} ብር</td><td className="p-3 text-slate-500">{e.Recorded_By || 'N/A'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INCOME REPORT TAB */}
      {activeReportCard === 'income' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> የገቢዎች ሪፖርት ዝርዝር ({filteredIncome.length})
            </h3>
            <button onClick={() => handlePrint('income-print-area', 'የገቢ ሪፖርት')} className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          <div id="income-print-area" className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr><th className="p-3">Income ID</th><th className="p-3">ቀን</th><th className="p-3">የገቢ ምንጭ</th><th className="p-3">መግለጫ</th><th className="p-3">ድምር (Total Price)</th><th className="p-3">የመዘገበው</th></tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredIncome.map((inc, i) => (
                  <tr key={i}><td className="p-3 font-bold text-blue-600">{inc.Income_ID || `INC-${i+1}`}</td><td className="p-3">{inc.Date}</td><td className="p-3 font-bold">{inc.Income_Source || inc.Income_Category}</td><td className="p-3">{inc.Description || '-'}</td><td className="p-3 font-black text-blue-600">{parseFloat(inc.Total_Price || inc.Price || 0).toLocaleString()} ብር</td><td className="p-3 text-slate-500">{inc.Recorded_By || 'N/A'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVENTORY REPORT TAB (ALL COLUMNS) */}
      {activeReportCard === 'inventory' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-600" /> የስቶክ እቃዎች ሪፖርት ዝርዝር ({filteredInventory.length})
            </h3>
            <button onClick={() => handlePrint('inventory-print-area', 'የስቶክ ሪፖርት')} className="px-4 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          <div id="inventory-print-area" className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3">ምስል</th>
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">የእቃ ስም</th>
                  <th className="p-3">Unit Type</th>
                  <th className="p-3">መሸጫ ዋጋ</th>
                  <th className="p-3">መግዣ ዋጋ</th>
                  <th className="p-3">ቀሪ ስቶክ</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {filteredInventory.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3">
                      {item.Item_Image || item.Image ? (
                        <img src={item.Item_Image || item.Image} alt="" className="w-9 h-9 object-cover rounded-xl border" />
                      ) : (
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><ImageIcon className="w-4 h-4" /></div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-500">{item.Item_ID || `ITM-${i+1}`}</td>
                    <td className="p-3 font-bold text-blue-600">{item.Item_Code || 'N/A'}</td>
                    <td className="p-3 font-bold">{item.Item_Name}</td>
                    <td className="p-3">{item.Unit_Type || 'Pcs'}</td>
                    <td className="p-3 font-bold text-emerald-600">{parseFloat(item.Selling_Price || 0).toLocaleString()} ብር</td>
                    <td className="p-3 font-bold text-rose-600">{parseFloat(item.Cost_Price || 0).toLocaleString()} ብር</td>
                    <td className="p-3 font-black">{parseFloat(item.Stock_Quantity || item.Stock || 0)} Pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MASTER SUMMARY TAB */}
      {activeReportCard === 'master' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" /> ማስተር ማጠቃለያ ሪፖርት
            </h3>
            <button onClick={() => handlePrint('master-print-area', 'ማስተር ሪፖርት')} className="px-4 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          <div id="master-print-area" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"><span className="text-[11px] font-bold text-emerald-800 uppercase block">ጠቅላላ የሽያጭ ገቢ</span><p className="text-xl font-black text-emerald-600 mt-1">{totalSalesVal.toLocaleString()} ብር</p></div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl"><span className="text-[11px] font-bold text-blue-800 uppercase block">ጠቅላላ ሌሎች ገቢዎች</span><p className="text-xl font-black text-blue-600 mt-1">{totalOtherIncomeVal.toLocaleString()} ብር</p></div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl"><span className="text-[11px] font-bold text-rose-800 uppercase block">ጠቅላላ የወጡ ወጪዎች</span><p className="text-xl font-black text-rose-600 mt-1">{totalExpensesVal.toLocaleString()} ብር</p></div>
          </div>
        </div>
      )}

      {/* PROFIT REPORT TAB */}
      {activeReportCard === 'profit' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" /> Profit / የትርፍ ክፍፍል ኦፊሴላዊ ሪፖርት
            </h3>
            <button onClick={() => handlePrint('profit-print-area', 'የትርፍ ክፍፍል ኦፊሴላዊ ሪፖርት')} className="px-5 py-2 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer">
              <Printer className="w-4 h-4" /> ሪፖርት ፕሪንት (PDF)
            </button>
          </div>

          <div id="profit-print-area" className="space-y-6 text-xs">
            
            <p className="text-slate-700 leading-relaxed font-semibold">
              ከላይ በተጠቀሰው የቀን ገደብ ውስጥ በድርጅታችን <strong>ክሊክ ኮምፒዉተር ሴንተር</strong> የተመዘገቡ የሽያጭ (Sales)፣ የተለያዩ የአገልግሎቶች ገቢ (Income)፣ የወጡ አጠቃላይ ወጪዎች (Expenses) እንዲሁም የዕቃ መግዣ ሂሳቦችን (Material_Cost) በሙሉ በጥንቃቄ በማሰላት የተጣራ የሂሳብ ሪፖርት እና የትርፍ ክፍፍል ማጠቃለያ ከዚህ በታች በዝርዝር ቀርቧል።
            </p>

            {/* 1. KPI DASHBOARD CARDS */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-sm border-b pb-1">1. ቁልፍ የካሽ እና የሂሳብ አመልካቾች (KPI Dashboard)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">የወሩ ጥቅል ሽያጭ</span>
                  <p className="text-base font-black text-emerald-600 mt-1">{totalSalesVal.toLocaleString()} ብር</p>
                </div>
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">ጠቅላላ ወጪ</span>
                  <p className="text-base font-black text-rose-600 mt-1">{totalExpensesVal.toLocaleString()} ብር</p>
                </div>
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">በእጅ ያለ ንጹህ ካሽ</span>
                  <p className="text-base font-black text-indigo-600 mt-1">{balance.toLocaleString()} ብር</p>
                </div>
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">የተሸጡ ዕቃዎች ብዛት</span>
                  <p className="text-base font-black text-blue-600 mt-1">{filteredSales.length} መዝገብ</p>
                </div>
              </div>
            </div>

            {/* 2. FINANCIAL BREAKDOWN TABLE */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-sm border-b pb-1">2. ዝርዝር የፋይናንስ መግለጫ (Financial Breakdown)</h4>
              <table>
                <thead>
                  <tr>
                    <th>የሂሳብ መደብ / መግለጫ (Description)</th>
                    <th>የገቢ ድምር (ብር)</th>
                    <th>የወጪ/መግዣ ድምር (ብር)</th>
                    <th>የተጣራ ውጤት (ብር)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">የዕቃዎች ሽያጭ ሂሳብ (Goods Sales)</td>
                    <td className="text-emerald-600 font-bold">{totalSalesVal.toLocaleString()}</td>
                    <td className="text-amber-600 font-bold">{totalSalesCostVal.toLocaleString()} (Cost)</td>
                    <td className="font-black text-purple-600">{netSalesProfit.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">ተጨማሪ የአገልግሎት ገቢዎች (Income_TBL)</td>
                    <td className="text-blue-600 font-bold">{totalOtherIncomeVal.toLocaleString()}</td>
                    <td className="text-amber-600 font-bold">{materialCost.toLocaleString()} (Material)</td>
                    <td className="font-black text-blue-600">{(totalOtherIncomeVal - materialCost).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">አጠቃላይ የሱቅ ወጪዎች (Expense_TBL)</td>
                    <td>-</td>
                    <td className="text-rose-600 font-bold">{totalExpensesVal.toLocaleString()}</td>
                    <td className="text-rose-600 font-black">-{totalExpensesVal.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50 font-black">
                    <td>ጥቅል የካሽ ፍሰት ድምር (Balance Transaction)</td>
                    <td colSpan={2} className="text-slate-700">ጠቃላይ ገቢ - አጠቃላይ ወጪ</td>
                    <td className="text-indigo-600 text-sm">{balance.toLocaleString()} ብር</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. PROFIT & STAFF SUMMARY */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-sm border-b pb-1">3. የትርፍ ክፍፍል እና የሰራተኛ አፈፃፀም ማጠቃለያ</h4>
              <table>
                <thead>
                  <tr>
                    <th>ተጋሪ አካል / የሰራተኛ ስም</th>
                    <th>የአክቲቭ ሰራተኞች ብዛት</th>
                    <th>የባለቤት የተጣራ ትርፍ (Owner)</th>
                    <th>የሰራተኛ ድርሻ (Staff Profit)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">ክሊክ ኮምፒውተር ሴንተር አድሚን</td>
                    <td>{users.length} ሰራተኞች</td>
                    <td className="font-black text-purple-700">{ownerProfit.toLocaleString()} ብር</td>
                    <td className="font-black text-emerald-600">{staffProfit.toLocaleString()} ብር</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. INVENTORY ALERTS */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-sm border-b pb-1">4. የመጋዘን ማንቂያዎች (Alerts)</h4>
              <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl font-bold text-amber-800">
                ⚠️ የመጋዘን ክምችት ሁኔታ (Low Stock): አጠቃላይ {inventory.length} እቃዎች በስቶክ ውስጥ ተመዝግበዋል።
              </p>
            </div>

            {/* FORMAL FOOTER NOTE */}
            <div className="footer-note">
              <strong>ማሳሰቢያ፦</strong> ይህ የሪፖርት ሰነድ አውቶማቲክ በሆነ መንገድ ከሲስተሙ የወጣ ሲሆን፣ የወሩን ትክክለኛ የፋይናንስ እንቅስቃሴ ያሳያል። ማንኛውም ጥያቄ ወይም ማብራሪያ ካለ ዋናው የፋይናንስ ዳታቤዝ ላይ ሪፖርት ፋይሉን በመክፈት ማረጋገጥ ይቻላል።
            </div>

          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📄 RECEIPT MODAL (WITH POS vs A5 INVOICE SELECTOR) */}
      {/* ================================================================= */}
      {selectedReceiptSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            
            <button onClick={() => setSelectedReceiptSale(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Type Selector */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-black text-xs text-slate-700">የደረሰኝ ቅርጸት ይምረጡ፦</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setReceiptType('a5')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${receiptType === 'a5' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  📄 A5 Invoice (ሙሉ ደረሰኝ)
                </button>
                <button
                  onClick={() => setReceiptType('pos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${receiptType === 'pos' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  🧾 POS Receipt (አጭር ደረሰኝ)
                </button>
              </div>
            </div>

            {/* Printable Receipt Area */}
            <div id="modal-receipt-print" className={`space-y-4 text-xs font-sans text-slate-900 pt-2 ${receiptType === 'a5' ? 'p-4 border rounded-2xl bg-slate-50' : ''}`}>
              
              <div className="text-center border-b pb-4 space-y-1">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-lg shadow-md">
                  CCC
                </div>
                <h3 className="font-black text-base text-slate-900">ክሊክ ኮምፒዉተር ሴንተር (Click Computer Center)</h3>
                <p className="text-[11px] text-slate-500 font-bold">Training, Maintenance & Sales Center</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">
                  {receiptType === 'a5' ? 'ኦፊሴላዊ የንግድ ደረሰኝ (A5 Tax-Free Invoice)' : 'POS የሽያጭ ማረጋገጫ ደረሰኝ'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl space-y-1.5 font-semibold text-[11px] border">
                <div className="flex justify-between"><span>ክፍያ ቁጥር (Invoice No):</span> <strong className="text-blue-600">{selectedReceiptSale.Invoice_No || 'INV-1001'}</strong></div>
                <div className="flex justify-between"><span>የተቆረጠበት ቀን:</span> <strong>{selectedReceiptSale.Date || new Date().toISOString().slice(0,10)}</strong></div>
                <div className="flex justify-between"><span>ደንበኛ:</span> <strong>{selectedReceiptSale.Customer_Name || 'Walk-in Customer'}</strong></div>
                <div className="flex justify-between"><span>የክፍያ ሁኔታ:</span> <strong>{selectedReceiptSale.Payment_Method || 'Cash'}</strong></div>
                <div className="flex justify-between"><span>መዝጋቢ ሰራተኛ:</span> <strong>{selectedReceiptSale.Recorded_By || 'Admin'}</strong></div>
              </div>

              {/* Items Table */}
              <div className="border rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">እቃ (Item Name)</th>
                      <th className="p-2.5">ብዛት (Qty)</th>
                      <th className="p-2.5">ዋጋ (Price)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    <tr>
                      <td className="p-2.5 font-bold">{selectedReceiptSale.Item_Name || 'ኮምፒዩተር መለዋወጫ እቃዎች'}</td>
                      <td className="p-2.5">{selectedReceiptSale.Qty || 1} Pcs</td>
                      <td className="p-2.5 font-bold text-emerald-600">{parseFloat(selectedReceiptSale.Total_Amount || selectedReceiptSale.Total_Price || 0).toLocaleString()} ብር</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex justify-between items-center text-sm font-black">
                <span>ጠቅላላ የሚከፈል (Total Amount):</span>
                <span className="text-emerald-400">{parseFloat(selectedReceiptSale.Total_Amount || selectedReceiptSale.Total_Price || 0).toLocaleString()} ብር</span>
              </div>

              {/* VAT FREE STATEMENT */}
              <div className="text-center bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl font-bold text-[10px]">
                📌 ይህ ደረሰኝ ከቫት ነፃ (VAT-Free) የሆነ የንግድ ማረጋገጫ ነው።
              </div>

              {receiptType === 'a5' && (
                <div className="pt-8 flex justify-between items-center text-xs font-bold border-t mt-4">
                  <div className="text-center">
                    <p>___________________________</p>
                    <p className="mt-1 text-[10px] text-slate-500">የአስተዳደር/ cashier ፊርማ</p>
                  </div>
                  <div className="text-center">
                    <p>___________________________</p>
                    <p className="mt-1 text-[10px] text-slate-500">የደንበኛ ፊርማ</p>
                  </div>
                </div>
              )}

            </div>

            {/* Print Action */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelectedReceiptSale(null)} className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer">
                ዝጋ (Close)
              </button>
              <button
                onClick={() => {
                  const content = document.getElementById('modal-receipt-print');
                  if (!content) return;
                  const win = window.open('', '', 'width=750,height=850');
                  if (!win) return;
                  win.document.write(`
                    <html>
                      <head>
                        <title>Official Receipt - Click Computer Center</title>
                        <style>
                          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; }
                        </style>
                      </head>
                      <body onload="window.print(); window.close();">
                        ${content.innerHTML}
                      </body>
                    </html>
                  `);
                  win.document.close();
                }}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> ደረሰኝ ፕሪንት አድርግ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
