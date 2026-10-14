'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Boxes, 
  Search, 
  Eye, 
  Printer, 
  ShoppingCart, 
  ArrowDownLeft, 
  Truck, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Clock, 
  Tag, 
  DollarSign,
  Edit3,
  Save,
  PackageSearch,
  TrendingUp,
  Layers,
  BarChart3,
  FileText,
  Copy,
  Send,
  MessageCircle,
  Phone,
  Building,
  User,
  Percent,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Hash,
  Package
} from 'lucide-react';
import { InventoryItem, SaleItem, SupplierItem, UserRole } from '../types';
import SupplierDetailModal from './SupplierDetailModal';

interface InventoryTabProps {
  inventory: InventoryItem[];
  sales: SaleItem[];
  stockInList?: any[];
  suppliers: SupplierItem[];
  currentUserRole: UserRole;
  currentUserEmail: string;
  onOpenAddModal: () => void;
  onOpenSalesWithItem?: (item: InventoryItem) => void;
}

// ============================================================
// ✅ SAFE NUMBER HELPER (Fix for NaN error)
// ============================================================
const safeNum = (val: any, fallback: number = 0): number => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = parseFloat(String(val));
  return isNaN(num) ? fallback : num;
};

export default function InventoryTab({
  inventory,
  sales,
  stockInList = [],
  suppliers,
  currentUserRole,
  currentUserEmail,
  onOpenAddModal,
  onOpenSalesWithItem,
}: InventoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});

  const isOwnerOrManager = currentUserRole === 'Owner' || currentUserRole === 'Manager';

  // ============================================================
  // 🧮 AUTO-CALCULATE CURRENT STOCK
  // Formula: Total Purchased (Stock-In) - Total Sold (Sales)
  // ============================================================
  const getCurrentStockQty = (item: InventoryItem): number => {
    const itemCode = String(item.Item_Code || item.Item_ID || '').trim().toLowerCase();
    const itemName = String(item.Item_Name || '').trim().toLowerCase();

    // --- 1. Total Purchased ---
    let totalPurchased = 0;

    if (stockInList && stockInList.length > 0) {
      const matchingStockIn = stockInList.filter((stk) => {
        const sCode = String(stk.Item_Code || stk.Item_ID || '').trim().toLowerCase();
        const sName = String(stk.Item_Name || '').trim().toLowerCase();
        return (itemCode && sCode === itemCode) || (itemName && sName === itemName);
      });

      if (matchingStockIn.length > 0) {
        totalPurchased = matchingStockIn.reduce(
          (acc, curr) =>
            acc +
            safeNum(
              curr.Quantity_In || curr.Qty || curr.Quantity || curr.Stock_In_Qty,
              0
            ),
          0
        );
      }
    }

    // Fallback: If no Stock-In history, use item's base Stock/Purchased_Qty
    if (totalPurchased === 0) {
      totalPurchased = safeNum(
        (item as any).Purchased_Qty ?? (item as any).Stock_Quantity ?? item.Stock,
        0
      );
    }

    // --- 2. Total Sold ---
    const matchingSales = sales.filter(
      (s) =>
        s.Item_Code === item.Item_Code ||
        s.Item_Name?.toLowerCase() === item.Item_Name?.toLowerCase()
    );
    const totalSold = matchingSales.reduce(
      (acc, curr) => acc + safeNum(curr.Quantity, 1),
      0
    );

    // --- 3. Remaining ---
    const remaining = totalPurchased - totalSold;
    return remaining > 0 ? remaining : 0;
  };

  // 🔍 Search + Low Stock Filter
  const filteredInventory = inventory.filter((item) => {
    const stockNum = getCurrentStockQty(item);
    const reorderNum = safeNum(item.Reorder_Level, 5);
    const isLow = stockNum <= reorderNum;

    if (showLowStockOnly && !isLow) return false;

    const term = searchTerm.toLowerCase();
    const nameMatches = (item.Item_Name || '').toLowerCase().includes(term);
    const codeMatches = (item.Item_Code || '').toLowerCase().includes(term);
    const supplierMatches = (item.Supplier_ID || '').toLowerCase().includes(term);

    return nameMatches || codeMatches || supplierMatches;
  });

  // Stats
  const lowStockCount = inventory.filter((i) => {
    const stockNum = getCurrentStockQty(i);
    const reorderNum = safeNum(i.Reorder_Level, 5);
    return stockNum <= reorderNum;
  }).length;

  const outOfStockCount = inventory.filter((i) => {
    const stockNum = getCurrentStockQty(i);
    return stockNum <= 0;
  }).length;

  const totalStockValue = inventory.reduce((a, c) => {
    const stockNum = getCurrentStockQty(c);
    const costNum = safeNum(c.Cost_Price, 0);
    return a + stockNum * costNum;
  }, 0);

  // Helper: Clean Username
  const getCleanUsername = (email: string) => {
    if (!email) return 'N/A';
    return email.includes('@') ? email.split('@')[0] : email;
  };

  // Helper: Get Stock Status
  const getStockStatus = (stk: number, reorder: number) => {
    if (stk <= 0) return { label: 'አልቋል', color: 'bg-rose-100 text-rose-700 border-rose-300', icon: '🔴' };
    if (stk <= reorder) return { label: 'ዝቅተኛ', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '🟡' };
    return { label: 'በቂ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '🟢' };
  };

  const handleSupplierClick = (supplierId: string) => {
    const found = suppliers.find(
      (s) =>
        s.Supplier_ID === supplierId ||
        s.Supplier_Name === supplierId ||
        (s as any).ID === supplierId
    );
    if (found) {
      setSelectedSupplier(found);
    } else {
      setSelectedSupplier({ Supplier_ID: supplierId, Supplier_Name: supplierId } as SupplierItem);
    }
    setIsSupplierModalOpen(true);
  };

  const getItemSalesHistory = (itemCodeOrName: string) => {
    return sales.filter(
      (s) =>
        s.Item_Code === itemCodeOrName ||
        s.Item_Name?.toLowerCase() === itemCodeOrName?.toLowerCase()
    );
  };

  const getItemStockInHistory = (itemCodeOrName: string) => {
    return stockInList.filter(
      (st) =>
        st.Item_Code === itemCodeOrName ||
        st.Item_Name?.toLowerCase() === itemCodeOrName?.toLowerCase()
    );
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditFormData({ ...item });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.Item_Name || !editFormData.Selling_Price) {
      alert('እባክዎን የእቃውን ስም እና የመሸጫ ዋጋ በትክክል ያስገቡ!');
      return;
    }

    try {
      const payload = {
        ...editFormData,
        Updated_By: currentUserEmail,
      };

      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert('የእቃው መረጃ በተሳካ ሁኔታ ተሻሽሏል!');
        setSelectedItem(payload as InventoryItem);
        setIsEditing(false);
      } else {
        alert('ስህተት ተፈጥሯል፡ ' + (json.error || 'እባክዎ እንደገና ይሞክሩ'));
      }
    } catch (err) {
      console.error(err);
      alert('የኔትወርክ ስህተት አጋጥሟል!');
    }
  };

  const handlePrint = (elementId: string, title: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    const win = window.open('', '', 'width=900,height=650');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${title} - Click Computer Center</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #0f172a; }
            h2 { margin-bottom: 5px; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 11px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
            .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 12px; margin-bottom: 20px; }
            .header h2 { margin: 0; font-size: 22px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CLICK COMPUTER CENTER</h2>
            <p>${title}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // ============================================================
  // 🖨️ PROFESSIONAL PRINT ITEM DETAIL
  // ============================================================
  const handlePrintItemDetail = (item: InventoryItem) => {
    const win = window.open('', '', 'width=800,height=850');
    if (!win) return;

    const iStock = getCurrentStockQty(item);
    const costVal = safeNum(item.Cost_Price, 0);
    const sellVal = safeNum(item.Selling_Price, 0);
    const profitPerItem = sellVal - costVal;
    const stockValue = iStock * costVal;
    const retailValue = iStock * sellVal;
    const potentialProfit = retailValue - stockValue;

    const supplierObj = suppliers.find(s => s.Supplier_ID === item.Supplier_ID || (s as any).ID === item.Supplier_ID);
    const supplierName = supplierObj?.Supplier_Name || (supplierObj as any)?.Name || item.Supplier_ID || 'N/A';

    const itemSales = getItemSalesHistory(item.Item_Code || item.Item_Name);
    const totalQtySold = itemSales.reduce((a, c) => a + safeNum(c.Quantity, 1), 0);
    const totalRevenue = itemSales.reduce((a, c) => a + safeNum(c.Total_Price, 0), 0);
    const totalSalesProfit = itemSales.reduce((a, c) => {
      const revenue = safeNum(c.Total_Price, 0);
      const cost = safeNum(c.Total_Cost_Amount, 0);
      return a + (revenue - cost);
    }, 0);

    win.document.write(`
      <html>
        <head>
          <title>Item Full Report - ${item.Item_Name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
            .header p { margin: 5px 0 0 0; font-size: 13px; color: #ea580c; font-weight: bold; }
            .item-name { font-size: 22px; font-weight: 900; text-align: center; margin: 20px 0; color: #1e293b; padding: 15px; background: #fff7ed; border-radius: 12px; }
            .section-title { font-size: 14px; font-weight: 900; margin: 25px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #ea580c; color: #1e293b; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .info-row { display: flex; justify-content: space-between; padding: 9px 14px; background: #f8fafc; border-radius: 8px; font-size: 12px; }
            .label { font-weight: bold; color: #475569; }
            .value { font-weight: 900; color: #0f172a; }
            .metric-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
            .metric { padding: 14px; border-radius: 12px; text-align: center; font-size: 11px; }
            .metric .m-label { font-weight: bold; text-transform: uppercase; opacity: 0.9; margin-bottom: 5px; }
            .metric .m-value { font-size: 18px; font-weight: 900; }
            .m-emerald { background: #d1fae5; color: #065f46; }
            .m-rose { background: #ffe4e6; color: #9f1239; }
            .m-blue { background: #dbeafe; color: #1e40af; }
            .m-purple { background: #ede9fe; color: #5b21b6; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
            th { background: #f1f5f9; font-weight: bold; color: #334155; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 2px dashed #cbd5e1; padding-top: 15px; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-box { text-align: center; width: 40%; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLICK COMPUTER CENTER</h1>
            <p>የእቃ ሙሉ ሪፖርት (Complete Item Report)</p>
          </div>

          <div class="item-name">${item.Item_Name}</div>

          <div class="section-title">📋 የእቃ መሰረታዊ መረጃ (Basic Information)</div>
          <div class="info-grid">
            <div class="info-row"><span class="label">🆔 ኮድ:</span><span class="value">${item.Item_Code || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📏 መለኪያ:</span><span class="value">${item.Unite_Type || 'Pcs'}</span></div>
            <div class="info-row"><span class="label">📦 የፓኬት መጠን:</span><span class="value">${(item as any).Pack_Size || '1'}</span></div>
            <div class="info-row"><span class="label">⚠️ ዝቅተኛ ገደብ:</span><span class="value">${safeNum(item.Reorder_Level, 5)}</span></div>
            <div class="info-row"><span class="label">🚚 አቅራቢ:</span><span class="value">${supplierName}</span></div>
            <div class="info-row"><span class="label">📅 የተመዘገበበት:</span><span class="value">${item.Date || 'N/A'}</span></div>
            <div class="info-row"><span class="label">👤 መዝጋቢ:</span><span class="value">${getCleanUsername((item as any).Recorded_By || 'N/A')}</span></div>
            <div class="info-row"><span class="label">📊 ሁኔታ:</span><span class="value">${item.Stock_Status || 'N/A'}</span></div>
          </div>

          <div class="section-title">💰 የፋይናንስ ማጠቃለያ (Financial Summary)</div>
          <div class="metric-box">
            <div class="metric m-rose"><div class="m-label">መግዣ ዋጋ</div><div class="m-value">${costVal.toLocaleString()} ብር</div></div>
            <div class="metric m-emerald"><div class="m-label">መሸጫ ዋጋ</div><div class="m-value">${sellVal.toLocaleString()} ብር</div></div>
            <div class="metric m-purple"><div class="m-label">የአንዱ ትርፍ</div><div class="m-value">${profitPerItem.toLocaleString()} ብር</div></div>
          </div>

          <div class="metric-box">
            <div class="metric m-blue"><div class="m-label">ያለው ስቶክ</div><div class="m-value">${iStock} Pcs</div></div>
            <div class="metric m-rose"><div class="m-label">የስቶክ ዋጋ</div><div class="m-value">${stockValue.toLocaleString()} ብር</div></div>
            <div class="metric m-emerald"><div class="m-label">ሊገኝ የሚችል ትርፍ</div><div class="m-value">${potentialProfit.toLocaleString()} ብር</div></div>
          </div>

          ${itemSales.length > 0 ? `
            <div class="section-title">📊 የሽያጭ አፈፃፀም (Sales Performance)</div>
            <div class="metric-box">
              <div class="metric m-blue"><div class="m-label">የተሸጠ ብዛት</div><div class="m-value">${totalQtySold} Pcs</div></div>
              <div class="metric m-emerald"><div class="m-label">የሽያጭ ገቢ</div><div class="m-value">${totalRevenue.toLocaleString()} ብር</div></div>
              <div class="metric m-purple"><div class="m-label">የሽያጭ ትርፍ</div><div class="m-value">${totalSalesProfit.toLocaleString()} ብር</div></div>
            </div>

            <div class="section-title">🧾 የሽያጭ ታሪክ (Sales History)</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ቀን</th>
                  <th>ብዛት</th>
                  <th>የአንዱ ዋጋ</th>
                  <th>ጠቅላላ</th>
                  <th>መዝጋቢ</th>
                </tr>
              </thead>
              <tbody>
                ${itemSales.map((s, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${s.Date || 'N/A'}</td>
                    <td><strong>${safeNum(s.Quantity, 1)}</strong></td>
                    <td>${safeNum(s.Unit_Price, 0).toLocaleString()} ብር</td>
                    <td><strong>${safeNum(s.Total_Price, 0).toLocaleString()} ብር</strong></td>
                    <td>${getCleanUsername(s.Recorded_By || 'N/A')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="text-align:center; color:#94a3b8; padding:20px;">ምንም የሽያጭ ታሪክ የለም።</p>'}

          <div class="signature">
            <div class="sig-box">
              <p>_________________________</p>
              <p style="margin-top:8px;">የሪፖርት አቅራቢ</p>
            </div>
            <div class="sig-box">
              <p>_________________________</p>
              <p style="margin-top:8px;">የድርጅቱ ባለቤት</p>
            </div>
          </div>

          <div class="footer">
            CLICK COMPUTER CENTER - System Generated Report<br/>
            የተዘጋጀበት ቀን: ${new Date().toLocaleDateString('am-ET')}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ============================================================
  // 📱 SHARE TEXT BUILDER
  // ============================================================
  const buildItemShareText = (item: InventoryItem) => {
    const iStock = getCurrentStockQty(item);
    const costVal = safeNum(item.Cost_Price, 0);
    const sellVal = safeNum(item.Selling_Price, 0);
    const profitPerItem = sellVal - costVal;
    const stockValue = iStock * costVal;
    const supplierObj = suppliers.find(s => s.Supplier_ID === item.Supplier_ID || (s as any).ID === item.Supplier_ID);
    const supplierName = supplierObj?.Supplier_Name || (supplierObj as any)?.Name || item.Supplier_ID || 'N/A';

    const itemSales = getItemSalesHistory(item.Item_Code || item.Item_Name);
    const totalQtySold = itemSales.reduce((a, c) => a + safeNum(c.Quantity, 1), 0);
    const totalRevenue = itemSales.reduce((a, c) => a + safeNum(c.Total_Price, 0), 0);

    return `
📦 የዕቃ ሙሉ መረጃ - CLICK COMPUTER CENTER
━━━━━━━━━━━━━━━━━━━━━
🏷️ ስም: ${item.Item_Name}
🆔 ኮድ: ${item.Item_Code || 'N/A'}
📏 መለኪያ: ${item.Unite_Type || 'Pcs'}
📦 Pack Size: ${(item as any).Pack_Size || '1'}
🚚 አቅራቢ: ${supplierName}
📅 የተመዘገበበት: ${item.Date || 'N/A'}
👤 መዝጋቢ: ${getCleanUsername((item as any).Recorded_By || 'N/A')}
━━━━━━━━━━━━━━━━━━━━━
💰 መግዣ ዋጋ: ${costVal.toLocaleString()} ብር
🏷️ መሸጫ ዋጋ: ${sellVal.toLocaleString()} ብር
📈 የአንዱ ትርፍ: ${profitPerItem.toLocaleString()} ብር
📦 ያለው ስቶክ: ${iStock} ${item.Unite_Type || 'Pcs'}
💎 የስቶክ ዋጋ: ${stockValue.toLocaleString()} ብር
⚠️ ዝቅተኛ ገደብ: ${safeNum(item.Reorder_Level, 5)}
━━━━━━━━━━━━━━━━━━━━━
🛒 የተሸጠው ብዛት: ${totalQtySold} Pcs
💵 የሽያጭ ገቢ: ${totalRevenue.toLocaleString()} ብር
━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* STICKY HEADER */}
      <div className="sticky top-[73px] z-20 bg-slate-50/95 backdrop-blur-md py-4 border-b border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-1">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">የስቶክ እቃዎች</h2>
              <p className="text-[11px] text-slate-500 font-bold">
                ጠቅላላ: <span className="text-blue-600">{inventory.length}</span> | 
                ዝቅተኛ: <span className="text-amber-600">{lowStockCount}</span> | 
                አልቋል: <span className="text-rose-600">{outOfStockCount}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="በስም፣ በኮድ ወይም በአቅራቢ ፈልግ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 border cursor-pointer whitespace-nowrap ${
                showLowStockOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              ዝቅተኛ ({lowStockCount})
            </button>

            <button
              onClick={onOpenAddModal}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              + አዲስ እቃ
            </button>
          </div>
        </div>

        {isOwnerOrManager && (
          <div className="mt-3 mx-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-800 uppercase">
                ጠቅላላ የስቶክ ዋጋ (Stock Value)
              </span>
            </div>
            <span className="text-lg font-black text-emerald-700">
              {totalStockValue.toLocaleString()} <span className="text-xs">ብር</span>
            </span>
          </div>
        )}
      </div>

      {/* CARDS GRID */}
      {filteredInventory.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-black text-slate-800">
            {showLowStockOnly ? 'ዝቅተኛ ስቶክ ያላቸው እቃዎች አልተገኙም' : 'የተፈለገው እቃ አልተገኘም'}
          </h4>
          <p className="text-xs text-slate-400">
            {showLowStockOnly ? 'ሁሉም እቃዎች በቂ ስቶክ አላቸው 🎉' : 'የጻፉትን የእቃ ስም ወይም ኮድ አረጋግጠው እንደገና ይሞክሩ'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredInventory.map((item, idx) => {
            const stockNum = getCurrentStockQty(item);
            const reorderNum = safeNum(item.Reorder_Level, 5);
            const isLowStock = stockNum <= reorderNum;
            const isOutOfStock = stockNum <= 0;
            const imgUrl = (item as any).Image_URL || (item as any).Photo || '/logo.png';

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  {isOutOfStock ? (
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 font-black text-[9px] rounded-lg border border-rose-200 shadow-sm">
                      አልቋል
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 font-black text-[9px] rounded-lg border border-amber-200 shadow-sm">
                      ዝቅተኛ
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] rounded-lg border border-emerald-200 shadow-sm">
                      አለ
                    </span>
                  )}
                </div>

                <div 
                  onClick={() => { setSelectedItem(item); setIsEditing(false); }}
                  className="w-full h-28 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-2 relative cursor-pointer overflow-hidden group-hover:scale-105 transition duration-300"
                >
                  <Image
                    src={imgUrl}
                    alt={item.Item_Name || 'Item'}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block self-start">
                    {item.Item_Code || 'CODE-N/A'}
                  </span>
                  <h3 
                    onClick={() => { setSelectedItem(item); setIsEditing(false); }}
                    className="font-black text-slate-900 text-xs line-clamp-1 cursor-pointer group-hover:text-blue-600 transition"
                  >
                    {item.Item_Name}
                  </h3>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-auto">
                    <span className="text-xs font-black text-emerald-600">
                      {safeNum(item.Selling_Price, 0).toLocaleString()}
                      <span className="text-[9px] font-bold text-slate-400 ml-0.5">ብር</span>
                    </span>
                    <span className={`text-xs font-black ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-700'}`}>
                      {stockNum}
                      <span className="text-[9px] font-normal text-slate-400 ml-0.5">{item.Unite_Type || 'Pcs'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 p-2 pt-0">
                  <button
                    onClick={() => { setSelectedItem(item); setIsEditing(false); }}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> ዝርዝር
                  </button>

                  <button
                    onClick={() => onOpenSalesWithItem && onOpenSalesWithItem(item)}
                    className="py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] rounded-lg flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <ShoppingCart className="w-3 h-3" /> ሽያጭ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* 🎨 PROFESSIONAL ITEM DETAIL MODAL */}
      {/* ================================================================= */}
      {selectedItem && (() => {
        const stockNum = getCurrentStockQty(selectedItem);
        const reorderNum = safeNum(selectedItem.Reorder_Level, 5);
        const costVal = safeNum(selectedItem.Cost_Price, 0);
        const sellVal = safeNum(selectedItem.Selling_Price, 0);
        const status = getStockStatus(stockNum, reorderNum);
        const profitPerItem = sellVal - costVal;
        const profitMargin = sellVal > 0 ? ((profitPerItem / sellVal) * 100).toFixed(1) : '0';
        const stockValue = stockNum * costVal;
        const retailValue = stockNum * sellVal;
        const potentialProfit = retailValue - stockValue;
        
        const supplierObj = suppliers.find(s => s.Supplier_ID === selectedItem.Supplier_ID || (s as any).ID === selectedItem.Supplier_ID);
        const supplierName = supplierObj?.Supplier_Name || (supplierObj as any)?.Name || selectedItem.Supplier_ID || 'N/A';

        const itemSales = getItemSalesHistory(selectedItem.Item_Code || selectedItem.Item_Name);
        const totalQtySold = itemSales.reduce((a, c) => a + safeNum(c.Quantity, 1), 0);
        const totalRevenue = itemSales.reduce((a, c) => a + safeNum(c.Total_Price, 0), 0);
        const totalSalesProfit = itemSales.reduce((a, c) => {
          const revenue = safeNum(c.Total_Price, 0);
          const cost = safeNum(c.Total_Cost_Amount, 0);
          return a + (revenue - cost);
        }, 0);
        const avgSalePrice = totalQtySold > 0 ? totalRevenue / totalQtySold : 0;
        const sellThroughRate = (stockNum + totalQtySold) > 0
          ? ((totalQtySold / (stockNum + totalQtySold)) * 100).toFixed(1)
          : '0';

        return (
          <div 
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto font-sans"
            onClick={() => { setSelectedItem(null); setIsEditing(false); }}
          >
            <div 
              className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative my-4 max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* HEADER */}
              <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-6 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

                <button
                  onClick={() => { setSelectedItem(null); setIsEditing(false); }}
                  className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white/30 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={(selectedItem as any).Image_URL || (selectedItem as any).Photo || '/logo.png'}
                      alt={selectedItem.Item_Name}
                      width={96}
                      height={96}
                      className="object-contain p-1"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg border-2 ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/25 backdrop-blur-sm border border-white/30">
                        {selectedItem.Unite_Type || 'Pcs'}
                      </span>
                      <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/25 backdrop-blur-sm border border-white/30">
                        🆔 {selectedItem.Item_Code || 'N/A'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black truncate mb-1">{selectedItem.Item_Name}</h2>
                    <p className="text-[11px] text-blue-100 font-bold flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" /> {supplierName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {selectedItem.Date || 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {isEditing ? (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-5 rounded-3xl space-y-4">
                    <h4 className="font-black text-sm text-amber-900 uppercase flex items-center gap-2 border-b border-amber-200 pb-3">
                      <Edit3 className="w-4 h-4 text-amber-600" /> የእቃ መረጃ ማስተካከያ ፎርም
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-700 mb-1.5 font-black">የእቃ ስም</label>
                        <input
                          type="text"
                          value={editFormData.Item_Name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, Item_Name: e.target.value })}
                          className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1.5 font-black">መሸጫ ዋጋ</label>
                        <input
                          type="number"
                          value={editFormData.Selling_Price || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, Selling_Price: safeNum(e.target.value, 0) })}
                          className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-emerald-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1.5 font-black">መግዣ ዋጋ</label>
                        <input
                          type="number"
                          value={editFormData.Cost_Price || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, Cost_Price: safeNum(e.target.value, 0) })}
                          className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-rose-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1.5 font-black">ያለው ስቶክ (Read-Only)</label>
                        <input
                          type="number"
                          value={stockNum}
                          readOnly
                          className="w-full p-3 bg-slate-100 border-2 border-slate-200 rounded-2xl font-bold cursor-not-allowed text-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1.5 font-black">መለኪያ</label>
                        <input
                          type="text"
                          value={editFormData.Unite_Type || 'Pcs'}
                          onChange={(e) => setEditFormData({ ...editFormData, Unite_Type: e.target.value })}
                          className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1.5 font-black">ዝቅተኛ ገደብ</label>
                        <input
                          type="number"
                          value={editFormData.Reorder_Level || 5}
                          onChange={(e) => setEditFormData({ ...editFormData, Reorder_Level: safeNum(e.target.value, 5) })}
                          className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t-2 border-amber-200">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-2xl transition cursor-pointer"
                      >
                        ሰርዝ
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center gap-2 transition cursor-pointer"
                      >
                        <Save className="w-4 h-4" /> ማሻሻያውን መዝግብ
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* KEY METRICS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3.5 text-white shadow-lg">
                        <Package className="w-5 h-5 mb-1.5 opacity-90" />
                        <span className="text-[9px] font-black uppercase block opacity-90">ያለው ስቶክ</span>
                        <p className="text-xl font-black">{stockNum}</p>
                        <span className="text-[9px] font-bold opacity-75">{selectedItem.Unite_Type || 'Pcs'}</span>
                      </div>

                      <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-3.5 text-white shadow-lg">
                        <ArrowDownRight className="w-5 h-5 mb-1.5 opacity-90" />
                        <span className="text-[9px] font-black uppercase block opacity-90">መግዣ ዋጋ</span>
                        <p className="text-lg font-black">
                          {isOwnerOrManager ? costVal.toLocaleString() : '***'}
                        </p>
                        <span className="text-[9px] font-bold opacity-75">{isOwnerOrManager ? 'ብር' : 'የተከለከለ'}</span>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-3.5 text-white shadow-lg">
                        <ArrowUpRight className="w-5 h-5 mb-1.5 opacity-90" />
                        <span className="text-[9px] font-black uppercase block opacity-90">መሸጫ ዋጋ</span>
                        <p className="text-lg font-black">{sellVal.toLocaleString()}</p>
                        <span className="text-[9px] font-bold opacity-75">ብር</span>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-3.5 text-white shadow-lg">
                        <Percent className="w-5 h-5 mb-1.5 opacity-90" />
                        <span className="text-[9px] font-black uppercase block opacity-90">የትርፍ መጠን</span>
                        <p className="text-lg font-black">{isOwnerOrManager ? `${profitMargin}%` : '***'}</p>
                        <span className="text-[9px] font-bold opacity-75">per unit</span>
                      </div>
                    </div>

                    {/* SALES PERFORMANCE */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-indigo-200 pb-2">
                        <h3 className="font-black text-sm text-indigo-900 uppercase flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-indigo-600" /> የሽያጭ አፈፃፀም
                        </h3>
                        <span className="text-[9px] font-black text-indigo-700 bg-indigo-100 px-2 py-1 rounded-lg">
                          {itemSales.length} ሽያጮች
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[9px] font-black text-slate-500 uppercase">የተሸጠ</span>
                          </div>
                          <p className="text-lg font-black text-blue-600">{totalQtySold}</p>
                          <span className="text-[9px] text-slate-400 font-bold">Pcs</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[9px] font-black text-slate-500 uppercase">ገቢ</span>
                          </div>
                          <p className="text-sm font-black text-emerald-600">{totalRevenue.toLocaleString()}</p>
                          <span className="text-[9px] text-slate-400 font-bold">ብር</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-[9px] font-black text-slate-500 uppercase">ትርፍ</span>
                          </div>
                          <p className="text-sm font-black text-purple-600">
                            {isOwnerOrManager ? totalSalesProfit.toLocaleString() : '***'}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold">ብር</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[9px] font-black text-slate-500 uppercase">አማካይ</span>
                          </div>
                          <p className="text-sm font-black text-amber-600">{avgSalePrice.toLocaleString()}</p>
                          <span className="text-[9px] text-slate-400 font-bold">ብር</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-indigo-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-black text-slate-600 uppercase">Sell-Through Rate</span>
                          <span className="text-xs font-black text-indigo-600">{sellThroughRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(safeNum(sellThroughRate, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* FINANCIAL SUMMARY */}
                    {isOwnerOrManager && (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
                        <h3 className="font-black text-sm text-emerald-900 uppercase flex items-center gap-2 border-b-2 border-emerald-200 pb-2">
                          <Wallet className="w-4 h-4 text-emerald-600" /> የፋይናንስ ማጠቃለያ
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-emerald-100">
                            <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">💎 የስቶክ ዋጋ</span>
                            <p className="text-base font-black text-rose-600">{stockValue.toLocaleString()}</p>
                            <span className="text-[9px] text-slate-400 font-bold">ብር</span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-emerald-100">
                            <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">💰 ሽያጭ ዋጋ</span>
                            <p className="text-base font-black text-emerald-600">{retailValue.toLocaleString()}</p>
                            <span className="text-[9px] text-slate-400 font-bold">ብር</span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-emerald-100">
                            <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">📈 ሊገኝ የሚችል ትርፍ</span>
                            <p className="text-base font-black text-purple-600">{potentialProfit.toLocaleString()}</p>
                            <span className="text-[9px] text-slate-400 font-bold">ብር</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* COMPLETE DETAILS */}
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                      <h3 className="font-black text-sm text-slate-900 uppercase flex items-center gap-2 border-b-2 border-slate-200 pb-2">
                        <FileText className="w-4 h-4 text-slate-600" /> የዕቃው ሙሉ ዝርዝር
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> ኮድ
                          </span>
                          <span className="font-black text-blue-600">{selectedItem.Item_Code || 'N/A'}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Package className="w-3 h-3" /> Pack Size
                          </span>
                          <span className="font-black text-slate-800">{(selectedItem as any).Pack_Size || '1'}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Truck className="w-3 h-3" /> አቅራቢ
                          </span>
                          <button
                            onClick={() => handleSupplierClick(selectedItem.Supplier_ID || '')}
                            className="font-black text-amber-700 hover:underline truncate cursor-pointer"
                          >
                            {supplierName} →
                          </button>
                        </div>

                        {supplierObj?.Company_Name && (
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5">
                              <Building className="w-3 h-3" /> ድርጅት
                            </span>
                            <span className="font-black text-slate-700 truncate">{supplierObj.Company_Name}</span>
                          </div>
                        )}

                        {supplierObj?.Phone_Number && (
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> የአቅራቢ ስልክ
                            </span>
                            <span className="font-black text-blue-600">{supplierObj.Phone_Number}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> ዝቅተኛ ገደብ
                          </span>
                          <span className="font-black text-amber-600">{reorderNum}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <User className="w-3 h-3" /> መዝጋቢ
                          </span>
                          <span className="font-black text-blue-600">
                            {getCleanUsername((selectedItem as any).Recorded_By || 'N/A')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> የተመዘገበበት
                          </span>
                          <span className="font-black text-slate-800">{selectedItem.Date || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="space-y-3 pt-2 border-t-2 border-slate-200">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">
                        🚀 አክሽን ቁልፎች
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePrintItemDetail(selectedItem)}
                          className="py-3 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" /> ፕሪንት ሪፖርት
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(buildItemShareText(selectedItem));
                            alert('✅ የእቃ መረጃ ተቀድቷል!');
                          }}
                          className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" /> ኮፒ አድርግ
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const text = buildItemShareText(selectedItem);
                            window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="py-3 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-4 h-4" /> Telegram
                        </button>
                        <button
                          onClick={() => {
                            const text = buildItemShareText(selectedItem);
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {isOwnerOrManager && (
                          <button
                            onClick={() => handleStartEdit(selectedItem)}
                            className="py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" /> ኤዲት አድርግ
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (onOpenSalesWithItem) onOpenSalesWithItem(selectedItem);
                            setSelectedItem(null);
                          }}
                          className={`py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                            !isOwnerOrManager ? 'col-span-2' : ''
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" /> ሽያጭ መዝግብ
                        </button>
                      </div>

                      <button
                        onClick={() => { setSelectedItem(null); setIsEditing(false); }}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        ← ወደ ዝርዝር ተመለስ
                      </button>
                    </div>

                    {/* SALES HISTORY TABLE */}
                    {itemSales.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-3">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-emerald-600" /> የሽያጭ ታሪክ ({itemSales.length})
                          </h4>
                          <button
                            onClick={() => handlePrint('sales-report-print', `የሽያጭ ሪፖርት - ${selectedItem.Item_Name}`)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-black text-[11px] rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> ፕሪንት
                          </button>
                        </div>

                        <div id="sales-report-print" className="border-2 border-slate-200 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 font-black text-emerald-800 grid grid-cols-5 gap-2 text-[11px] uppercase sticky top-0">
                            <span>ቀን</span>
                            <span>ብዛት</span>
                            <span>የአንዱ ዋጋ</span>
                            <span>ጠቅላላ</span>
                            <span>መዝጋቢ</span>
                          </div>
                          {itemSales.map((s, i) => (
                            <div key={i} className="p-3 grid grid-cols-5 gap-2 items-center text-slate-800 font-medium text-xs border-t border-slate-100 hover:bg-slate-50 transition">
                              <span>{s.Date || 'N/A'}</span>
                              <span className="font-black text-blue-600">{safeNum(s.Quantity, 1)}</span>
                              <span>{safeNum(s.Unit_Price, 0).toLocaleString()} ብር</span>
                              <span className="font-black text-emerald-600">{safeNum(s.Total_Price, 0).toLocaleString()} ብር</span>
                              <span className="text-[10px] text-slate-500 truncate">{getCleanUsername(s.Recorded_By || 'N/A')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STOCK-IN HISTORY TABLE */}
                    {getItemStockInHistory(selectedItem.Item_Code || selectedItem.Item_Name).length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b-2 border-blue-200 pb-3">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4 text-blue-600" /> የስቶክ ገቢ ታሪክ ({getItemStockInHistory(selectedItem.Item_Code || selectedItem.Item_Name).length})
                          </h4>
                          <button
                            onClick={() => handlePrint('stockin-report-print', `የስቶክ ገቢ ሪፖርት - ${selectedItem.Item_Name}`)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-black text-[11px] rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> ፕሪንት
                          </button>
                        </div>

                        <div id="stockin-report-print" className="border-2 border-slate-200 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 font-black text-blue-800 grid grid-cols-5 gap-2 text-[11px] uppercase sticky top-0">
                            <span>ቀን</span>
                            <span>ብዛት</span>
                            <span>የግዢ ዋጋ</span>
                            <span>አቅራቢ</span>
                            <span>መዝጋቢ</span>
                          </div>
                          {getItemStockInHistory(selectedItem.Item_Code || selectedItem.Item_Name).map((st, i) => (
                            <div key={i} className="p-3 grid grid-cols-5 gap-2 items-center text-slate-800 font-medium text-xs border-t border-slate-100 hover:bg-slate-50 transition">
                              <span>{st.Date || 'N/A'}</span>
                              <span className="font-black text-blue-600">{safeNum(st.Quantity, 1)}</span>
                              <span className="font-black text-rose-600">
                                {isOwnerOrManager ? `${safeNum(st.Cost_Price, 0).toLocaleString()} ብር` : '***'}
                              </span>
                              <span className="truncate">{st.Supplier_ID || 'N/A'}</span>
                              <span className="text-[10px] text-slate-500 truncate">{getCleanUsername(st.Recorded_By || 'N/A')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>
          </div>
        );
      })()}

      {/* SUPPLIER PROFILE MODAL */}
      <SupplierDetailModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={selectedSupplier}
        allInventory={inventory}
      />

    </div>
  );
}
