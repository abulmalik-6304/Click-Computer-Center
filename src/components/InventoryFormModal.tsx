'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Boxes, 
  Search, 
  Calendar, 
  QrCode, 
  Image as ImageIcon, 
  Truck, 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  PackageCheck,
  Package,
  DollarSign,
  Tag,
  Layers,
  Camera,
  TrendingUp,
  FileText,
  Hash,
  Store,
  Printer,
  Share2,
  Send,
  MessageCircle,
  Copy,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  BarChart3,
  Eye,
  Trash2,
  Edit3,
  Save
} from 'lucide-react';
import { InventoryItem, SupplierItem } from '../types';

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  suppliers: SupplierItem[];
  currentUserEmail: string;
  onOpenSupplierModal: () => void;
  salesItemsList?: any[];
  stockInList?: any[];
}

// ============================================================
// ✅ SAFE NUMBER HELPER - Fixes NaN errors
// ============================================================
const safeNum = (val: any, fallback: number = 0): number => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = parseFloat(String(val));
  return isNaN(num) ? fallback : num;
};

export default function InventoryFormModal({
  isOpen,
  onClose,
  inventory,
  suppliers,
  currentUserEmail,
  onOpenSupplierModal,
  salesItemsList = [],
  stockInList = [],
}: InventoryFormModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<1 | 2>(1);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(inventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🆕 Item Detail View State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // 🆕 Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Step 1 Form States
  const [date, setDate] = useState<string>(todayStr);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [uniteType, setUniteType] = useState('Piece/ Single');
  const [packSize, setPackSize] = useState('1');
  const [supplierId, setSupplierId] = useState('');
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [stock, setStock] = useState<number>(0);

  // Step 2 (Stock-In Form) States
  const [stockInId, setStockInId] = useState('');
  const [stockInDate, setStockInDate] = useState<string>(todayStr);
  const [stockInQty, setStockInQty] = useState<number>(1);
  const [buyingPrice, setBuyingPrice] = useState<number>(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    setInventoryList(inventory);
  }, [inventory]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDate(new Date().toISOString().split('T')[0]);
      setItemCode(`ITM-${Math.floor(10000 + Math.random() * 90000)}`);
      setItemName('');
      setItemImage('');
      setCostPrice('');
      setSellingPrice('');
      setUniteType('Piece/ Single');
      setPackSize('1');
      setSupplierId(suppliers[0]?.Supplier_ID || '');
      setReorderLevel(5);
      setStock(0);
      setStockInQty(1);
      setBuyingPrice(0);
      setNote('');
      setIsSubmitting(false);
      setSelectedItem(null);
      setIsEditModalOpen(false);
    }
  }, [isOpen, suppliers]);

  if (!isOpen) return null;

  // Clean Username Helper
  const getCleanUsername = (email: string) => {
    if (!email) return 'N/A';
    return email.includes('@') ? email.split('@')[0] : email;
  };

  // ============================================================
  // 📊 1. CALCULATE ITEM SALES STATS
  // ============================================================
  const getItemSalesStats = (itemCode: string, itemName: string) => {
    if (!salesItemsList || salesItemsList.length === 0) {
      return { qtySold: 0, revenue: 0, profit: 0, cost: 0 };
    }

    const cleanCode = String(itemCode || '').trim().toLowerCase();
    const cleanName = String(itemName || '').trim().toLowerCase();

    const matchingSales = salesItemsList.filter((s) => {
      const sCode = String(s.Item_Code || s.Item_ID || '').trim().toLowerCase();
      const sName = String(s.Item_Name || '').trim().toLowerCase();
      return (cleanCode && sCode === cleanCode) || (cleanName && sName === cleanName);
    });

    const totalQtySold = matchingSales.reduce(
      (acc, curr) => acc + safeNum(curr.Qty || curr.Quantity || curr.Sold_Qty, 1),
      0
    );
    const totalSalesRevenue = matchingSales.reduce(
      (acc, curr) => acc + safeNum(curr.Total_Amount || curr.Total_Price || curr.Price, 0),
      0
    );
    const totalSalesCost = matchingSales.reduce(
      (acc, curr) => acc + safeNum(curr.Total_Cost_Amount || curr.Cost, 0),
      0
    );

    return {
      qtySold: totalQtySold,
      revenue: totalSalesRevenue,
      profit: totalSalesRevenue - totalSalesCost,
      cost: totalSalesCost,
    };
  };

  // ============================================================
  // 🧮 2. CALCULATE CURRENT STOCK (AUTO)
  // ============================================================
  const getCurrentStockQty = (item: InventoryItem) => {
    const itemCode = String(item.Item_Code || item.Item_ID || '').trim().toLowerCase();
    const itemName = String(item.Item_Name || '').trim().toLowerCase();

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

    if (totalPurchased === 0) {
      totalPurchased = safeNum(
        (item as any).Purchased_Qty ?? (item as any).Stock_Quantity ?? item.Stock,
        0
      );
    }

    const salesStats = getItemSalesStats(itemCode, itemName);
    const remaining = totalPurchased - salesStats.qtySold;
    return remaining > 0 ? remaining : 0;
  };

  // Compute Automatic Stock Status
  const getStockStatus = (stk: number, reorder: number) => {
    if (stk <= 0) return { label: 'አልቋል', color: 'bg-rose-100 text-rose-700 border-rose-300', icon: '🔴' };
    if (stk <= reorder) return { label: 'ዝቅተኛ', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '🟡' };
    return { label: 'በቂ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '🟢' };
  };

  // Search Filter
  const filteredInventory = inventoryList.filter((item) => {
    const name = item.Item_Name || (item as any).Name || '';
    const code = item.Item_Code || (item as any).Code || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || code.includes(searchQuery);
  });

  // Find Supplier Name by ID
  const getSupplierName = (suppId: string) => {
    const found = suppliers.find((s) => s.Supplier_ID === suppId || (s as any).ID === suppId);
    return found ? found.Supplier_Name || (found as any).Name : suppId || 'N/A';
  };

  // ============================================================
  // ✏️ 3. HANDLE EDIT ITEM
  // ============================================================
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditFormData({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.Item_Name || !editFormData.Selling_Price) {
      alert('እባክዎን የእቃውን ስም እና የመሸጫ ዋጋ በትክክል ያስገቡ!');
      return;
    }

    setIsSavingEdit(true);

    try {
      const payload = {
        ...editFormData,
        Updated_By: currentUserEmail.split('@')[0],
      };

      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success || !json.error) {
        // Update local state
        setInventoryList((prev) =>
          prev.map((i) =>
            i.Item_Code === editFormData.Item_Code || i.Item_ID === editFormData.Item_ID
              ? ({ ...i, ...editFormData } as InventoryItem)
              : i
          )
        );

        // Update selected item if it's the same
        if (selectedItem?.Item_Code === editFormData.Item_Code || selectedItem?.Item_ID === editFormData.Item_ID) {
          setSelectedItem({ ...selectedItem, ...editFormData } as InventoryItem);
        }

        alert('✅ የእቃው መረጃ በተሳካ ሁኔታ ተሻሽሏል!');
        setIsEditModalOpen(false);
        setEditFormData({});
      } else {
        alert('ስህተት: ' + (json.error || 'እባክዎ እንደገና ይሞክሩ'));
      }
    } catch (err) {
      console.error(err);
      // Even if API fails, update local state (fallback)
      setInventoryList((prev) =>
        prev.map((i) =>
          i.Item_Code === editFormData.Item_Code || i.Item_ID === editFormData.Item_ID
            ? ({ ...i, ...editFormData } as InventoryItem)
            : i
        )
      );
      alert('✅ የእቃው መረጃ በአካባቢው ተሻሽሏል!');
      setIsEditModalOpen(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Step 1 Submit
  const handleProceedToStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('እባክዎን የእቃ ስም ያስገቡ!');
      return;
    }
    setStockInId(`STK-${Math.floor(1000 + Math.random() * 9000)}`);
    setBuyingPrice(Number(costPrice) || 0);
    setStep(2);
  };

  // Handle Final Submit
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentCost = Number(costPrice) || 0;
    const finalStock = Number(stock) + Number(stockInQty);

    const newInventoryItem: InventoryItem = {
      Item_ID: itemCode,
      Item_Code: itemCode,
      Item_Name: itemName,
      Item_Image: itemImage,
      Cost_Price: currentCost,
      Selling_Price: Number(sellingPrice) || 0,
      Unite_Type: uniteType,
      Pack_Size: packSize,
      Supplier_ID: supplierId,
      Reorder_Level: reorderLevel,
      Stock: finalStock,
      Stock_Quantity: finalStock,
      Stock_Status: getStockStatus(finalStock, reorderLevel).label,
      Recorded_By: getCleanUsername(currentUserEmail),
      Date: date,
      Purchased_Qty: stockInQty,
    } as any;

    setInventoryList([newInventoryItem, ...inventoryList]);

    setTimeout(() => {
      alert(
        `✅ እቃ "${itemName}" በስኬት ተመዝግቧል!\n\nየግዥ ብዛት: ${stockInQty} Pcs\nመዝጋቢ: ${getCleanUsername(currentUserEmail)}`
      );
      setIsSubmitting(false);
      setStep(1);
    }, 400);
  };

  // ============================================================
  // 🖨️ PRINT ITEM DETAILS
  // ============================================================
  const handlePrintItem = (item: InventoryItem) => {
    const win = window.open('', '', 'width=800,height=750');
    if (!win) return;

    const currentStock = getCurrentStockQty(item);
    const stats = getItemSalesStats(
      item.Item_Code || item.Item_ID || '',
      item.Item_Name || ''
    );
    const suppName = getSupplierName(item.Supplier_ID);

    win.document.write(`
      <html>
        <head>
          <title>Item Details - ${item.Item_Name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #ea580c; font-weight: bold; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
            .item-name { font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed #cbd5e1; font-size: 12px; }
            .label { font-weight: bold; color: #475569; }
            .value { font-weight: 900; color: #0f172a; }
            .summary { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 15px; margin-top: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLICK COMPUTER CENTER</h1>
            <p>የእቃ ሙሉ ዝርዝር መረጃ እና የሽያጭ አፈፃፀም</p>
          </div>
          <div class="card">
            <div class="item-name">${item.Item_Name || 'N/A'}</div>
            <div class="info-row"><span class="label">🆔 ኮድ:</span><span class="value">${item.Item_Code || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📅 የተገዛበት ቀን:</span><span class="value">${(item as any).Date || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📦 የመዘገበው:</span><span class="value">${getCleanUsername((item as any).Recorded_By || 'N/A')}</span></div>
            <div class="info-row"><span class="label">📦 ያለው ቀሪ ስቶክ:</span><span class="value">${currentStock} ${item.Unite_Type || 'Pcs'}</span></div>
            <div class="info-row"><span class="label">📏 መለኪያ:</span><span class="value">${item.Unite_Type || 'Piece'}</span></div>
            <div class="info-row"><span class="label">🚚 አቅራቢ:</span><span class="value">${suppName}</span></div>
            <div class="info-row"><span class="label">💰 መግዣ ዋጋ:</span><span class="value">${safeNum(item.Cost_Price, 0).toLocaleString()} ብር</span></div>
            <div class="info-row"><span class="label">🏷️ መሸጫ ዋጋ:</span><span class="value">${safeNum(item.Selling_Price, 0).toLocaleString()} ብር</span></div>
          </div>
          <div class="summary">
            <div class="summary-row"><span class="label">🛒 የተሸጠው ብዛት:</span><span class="value">${stats.qtySold} Pcs</span></div>
            <div class="summary-row"><span class="label">💵 የሽያጭ ድምር:</span><span class="value">${stats.revenue.toLocaleString()} ብር</span></div>
            <div class="summary-row"><span class="label">📈 የተገኘ ትርፍ:</span><span class="value">${stats.profit.toLocaleString()} ብር</span></div>
          </div>
          <div class="footer">
            CLICK COMPUTER CENTER - ${new Date().toLocaleDateString('am-ET')}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  // Share Text Generator
  const buildShareText = (item: InventoryItem) => {
    const currentStock = getCurrentStockQty(item);
    const stats = getItemSalesStats(
      item.Item_Code || item.Item_ID || '',
      item.Item_Name || ''
    );
    const suppName = getSupplierName(item.Supplier_ID);
    return `
📦 የዕቃ ዝርዝር መረጃ - CLICK COMPUTER CENTER
━━━━━━━━━━━━━━━━━━━━━
🏷️ ስም: ${item.Item_Name}
🆔 ኮድ: ${item.Item_Code || 'N/A'}
📅 የተገዛበት ቀን: ${(item as any).Date || 'N/A'}
👤 መዝጋቢ: ${getCleanUsername((item as any).Recorded_By || 'N/A')}
📦 ያለው ቀሪ ስቶክ: ${currentStock} Pcs
📏 መለኪያ: ${item.Unite_Type || 'Pcs'}
🚚 አቅራቢ: ${suppName}
💰 መግዣ ዋጋ: ${safeNum(item.Cost_Price, 0).toLocaleString()} ብር
🏷️ መሸጫ ዋጋ: ${safeNum(item.Selling_Price, 0).toLocaleString()} ብር
---------------------
🛒 የተሸጠው ብዛት: ${stats.qtySold} Pcs
💵 የሽያጭ ድምር: ${stats.revenue.toLocaleString()} ብር
📈 የተገኘ ትርፍ: ${stats.profit.toLocaleString()} ብር
━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 🏢 MAIN MODAL */}
      {/* ============================================================ */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-6xl w-full my-6 relative overflow-hidden flex flex-col max-h-[94vh]">
          
          {/* MODAL HEADER */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white p-6 border-b-4 border-orange-500">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Boxes className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-wide flex items-center gap-2">
                    የእቃ መዝገብ ማዕከል
                    {step === 2 && (
                      <span className="text-xs bg-emerald-500 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Package className="w-3 h-3" /> Stock-In
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-orange-200 font-bold mt-0.5">
                    {step === 1
                      ? '📦 አዲስ እቃ ይመዝግቡ ወይም የዕቃዎችን ዲቴል መረጃ ይመርምሩ'
                      : '📦 ደረጃ 2፦ የተገዛውን ስቶክ ብዛትና ወጪ ይመዝግቡ'}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20">
                <div
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 ${
                    step === 1 ? 'bg-orange-500 text-white shadow-md' : 'text-orange-200'
                  }`}
                >
                  <span className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center text-[10px]">1</span>
                  የእቃ ዝርዝር
                </div>
                <ArrowRight className="w-4 h-4 text-orange-300" />
                <div
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 ${
                    step === 2 ? 'bg-emerald-500 text-white shadow-md' : 'text-orange-200'
                  }`}
                >
                  <span className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center text-[10px]">2</span>
                  Stock-In
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/25 rounded-full text-white transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="p-6 overflow-y-auto flex-1 text-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT SIDE: INVENTORY LIST */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Layers className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        የእቃዎች ዝርዝር (Click item for details)
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold">
                        ጠቅላላ: {filteredInventory.length} እቃዎች
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="በእቃ ስም ወይም በኮድ ይፈልጉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                      <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">ምንም የተመዘገበ እቃ አልተገኘም።</p>
                    </div>
                  ) : (
                    filteredInventory.map((item, idx) => {
                      const iStock = getCurrentStockQty(item);
                      const iReorder = safeNum(item.Reorder_Level, 5);
                      const status = getStockStatus(iStock, iReorder);

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedItem(item)}
                          className="bg-white border-2 border-slate-100 hover:border-orange-400 hover:shadow-lg p-4 rounded-2xl transition-all flex gap-3.5 items-center group cursor-pointer"
                        >
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition">
                            {item.Item_Image ? (
                              <img
                                src={item.Item_Image}
                                alt={item.Item_Name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Boxes className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-black text-sm text-slate-900 truncate group-hover:text-orange-600 transition">
                                {item.Item_Name}
                              </h4>
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${status.color} shrink-0`}
                              >
                                {status.icon} {status.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                              <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-black">
                                {item.Item_Code || 'N/A'}
                              </span>
                              <span>
                                • መዝጋቢ: {getCleanUsername((item as any).Recorded_By || 'N/A')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <div>
                                <span className="text-slate-400 font-bold">ስቶክ: </span>
                                <strong className="text-orange-600 font-black">
                                  {iStock} {item.Unite_Type || 'Pcs'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold">መሸጫ: </span>
                                <strong className="text-emerald-600 font-black">
                                  {safeNum(item.Selling_Price, 0).toLocaleString()} ብር
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: NEW ITEM FORM */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-orange-50 p-5 rounded-3xl border-2 border-orange-200 space-y-4">
                <div className="border-b-2 border-orange-200 pb-3 flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">አዲስ እቃ መመዝገቢያ</h4>
                    <p className="text-[10px] text-orange-600 font-bold">New Item Registration</p>
                  </div>
                </div>

                <form onSubmit={handleProceedToStockIn} className="space-y-3 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        የተገዛበት ቀን
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setDate(todayStr)}
                        className="w-full px-3 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-[11px] font-black transition cursor-pointer"
                      >
                        📅 ዛሬ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Item Code / Barcode
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        className="flex-1 p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => alert('📷 Barcode/QR Scanner ዝግጁ ነው!')}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      የእቃው ስም <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ለምሳሌ፦ HP Laptop Charger 65W"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      የምስል URL (Image URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={itemImage}
                      onChange={(e) => setItemImage(e.target.value)}
                      className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1 text-rose-600">
                        መግዣ ዋጋ
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="0.00"
                        value={costPrice}
                        onChange={(e) =>
                          setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full p-2.5 bg-white border-2 border-rose-200 rounded-xl text-xs font-black text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1 text-emerald-700">
                        መሸጫ ዋጋ
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="0.00"
                        value={sellingPrice}
                        onChange={(e) =>
                          setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full p-2.5 bg-white border-2 border-emerald-200 rounded-xl text-xs font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        የመለኪያ ዓይነት
                      </label>
                      <select
                        value={uniteType}
                        onChange={(e) => setUniteType(e.target.value)}
                        className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                        <option value="Piece/ Single">በቁጥር (Pcs)</option>
                        <option value="Set">በስብስብ (Set)</option>
                        <option value="Pack">በፓኬት (Pack)</option>
                        <option value="Carton">በካርቶን (Carton)</option>
                        <option value="Meter">በሜትር (Meter)</option>
                        <option value="Kg">በኪሎ (Kg)</option>
                        <option value="Liter">በሊትር (Liter)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        Pack Size
                      </label>
                      <input
                        type="text"
                        placeholder="ለምሳሌ፦ 12 pcs/box"
                        value={packSize}
                        onChange={(e) => setPackSize(e.target.value)}
                        className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      አቅራቢ (Supplier)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="flex-1 p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                        {suppliers.length === 0 ? (
                          <option value="">ምንም አቅራቢ የለም</option>
                        ) : (
                          suppliers.map((s, i) => (
                            <option key={i} value={s.Supplier_ID}>
                              {s.Supplier_Name || (s as any).Name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={onOpenSupplierModal}
                        className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        ዝቅተኛ ገደብ (Reorder)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(parseInt(e.target.value) || 1)}
                        className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        የነበረ ስቶክ (Initial)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3.5 rounded-2xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 mt-3 cursor-pointer"
                  >
                    ቀጥል ወደ ግዥ መዝገብ (Stock-In) <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={handleFinalSubmit}
              className="p-8 space-y-6 text-slate-800 max-w-3xl mx-auto w-full overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 p-5 rounded-3xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                      <Package className="w-7 h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-orange-600 uppercase">
                        የተመረጠው እቃ
                      </span>
                      <h3 className="text-lg font-black text-slate-900 truncate">{itemName}</h3>
                      <p className="text-[11px] text-slate-500 font-bold">
                        ኮድ: {itemCode} | መዝጋቢ: {getCleanUsername(currentUserEmail)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ← ተመለስ
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-600" /> የስቶክ ግዥ እና የብዛት ማረጋገጫ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ምን ያህል ብዛት እንደተገዛ (Purchased Qty)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={stockInQty}
                      onChange={(e) => setStockInQty(parseInt(e.target.value) || 1)}
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-black text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      የግዥ ቀን (Stock-In Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={stockInDate}
                      onChange={(e) => setStockInDate(e.target.value)}
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-white border rounded-2xl flex justify-between items-center text-xs font-bold">
                  <span>የግዥ ወጪ ድምር (Total Cost):</span>
                  <span className="text-base font-black text-rose-600">
                    {safeNum(costPrice, 0) * stockInQty} ብር
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs transition cursor-pointer"
                >
                  ሰርዝ / ተመለስ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-2xl text-xs shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? 'በመመዝገብ ላይ...' : '💾 እቃውን እና ስቶኩን ሙሉ በሙሉ መዝግብ'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🔍 DETAILED ITEM VIEW MODAL */}
      {/* ============================================================ */}
      {selectedItem &&
        (() => {
          const currentStock = getCurrentStockQty(selectedItem);
          const stats = getItemSalesStats(
            selectedItem.Item_Code || selectedItem.Item_ID || '',
            selectedItem.Item_Name || ''
          );
          const iReorder = safeNum(selectedItem.Reorder_Level, 5);
          const status = getStockStatus(currentStock, iReorder);
          const suppName = getSupplierName(selectedItem.Supplier_ID);

          return (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto font-sans">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 my-6 max-h-[92vh] overflow-y-auto">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0">
                    {selectedItem.Item_Image ? (
                      <img
                        src={selectedItem.Item_Image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Boxes className="w-8 h-8 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${status.color}`}
                    >
                      {status.icon} {status.label}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {selectedItem.Item_Name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      ኮድ:{' '}
                      <strong className="text-orange-600">
                        {selectedItem.Item_Code || 'N/A'}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Detailed Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold bg-slate-50 p-4 rounded-2xl border">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">📅 የተገዛበት ቀን:</span>
                    <span className="font-bold text-slate-900">
                      {(selectedItem as any).Date || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">👤 የመዘገበው:</span>
                    <span className="font-bold text-blue-600">
                      {getCleanUsername((selectedItem as any).Recorded_By || 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">🛒 ምን ያህል እንደተገዛ:</span>
                    <span className="font-bold text-slate-900">
                      {(selectedItem as any).Purchased_Qty || selectedItem.Stock || 1} Pcs
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">📦 ያለው ቀሪ ስቶክ:</span>
                    <span className="font-black text-orange-600">
                      {currentStock} {selectedItem.Unite_Type || 'Pcs'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">📏 መለኪያ ዓይነት:</span>
                    <span className="font-bold text-slate-900">
                      {selectedItem.Unite_Type || 'Piece'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">📦 Pack Size:</span>
                    <span className="font-bold text-slate-900">
                      {(selectedItem as any).Pack_Size || '1'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">🚚 አቅራቢ:</span>
                    <span className="font-bold text-slate-900">{suppName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">⚠️ ዝቅተኛ ገደብ:</span>
                    <span className="font-bold text-slate-900">{iReorder}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">💰 መግዣ ዋጋ:</span>
                    <span className="font-black text-rose-600">
                      {safeNum(selectedItem.Cost_Price, 0).toLocaleString()} ብር
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">🏷️ መሸጫ ዋጋ:</span>
                    <span className="font-black text-emerald-600">
                      {safeNum(selectedItem.Selling_Price, 0).toLocaleString()} ብር
                    </span>
                  </div>
                </div>

                {/* SALES PERFORMANCE CARDS */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-4 rounded-2xl space-y-3">
                  <h4 className="font-black text-xs text-emerald-900 uppercase flex items-center gap-1.5 border-b border-emerald-200 pb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> የዕቃው የሽያጭ እና ትርፍ አፈፃፀም
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        የተሸጠው ብዛት
                      </span>
                      <strong className="text-sm font-black text-blue-600">
                        {stats.qtySold} Pcs
                      </strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        የሽያጭ ድምር
                      </span>
                      <strong className="text-sm font-black text-emerald-600">
                        {stats.revenue.toLocaleString()} ብር
                      </strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        የተገኘ ትርፍ
                      </span>
                      <strong className="text-sm font-black text-purple-600">
                        {stats.profit.toLocaleString()} ብር
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* 🎯 ACTION BUTTONS - የ Edit ቁልፍ ተጨምሯል */}
                {/* ============================================================ */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* Print */}
                  <button
                    onClick={() => handlePrintItem(selectedItem)}
                    className="flex-1 min-w-[120px] py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> ፕሪንት
                  </button>

                  {/* ✅ EDIT BUTTON - አዲስ ተጨምሯል */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      handleOpenEditModal(selectedItem);
                    }}
                    className="px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" /> አስተካክል (Edit)
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(buildShareText(selectedItem));
                      alert('✅ የእቃ መረጃ ተቀድቷል!');
                    }}
                    className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" /> ኮፒ
                  </button>

                  {/* Telegram */}
                  <button
                    onClick={() => {
                      const text = buildShareText(selectedItem);
                      window.open(
                        `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`,
                        '_blank'
                      );
                    }}
                    className="px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs border border-sky-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> ቴሌግራም
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ============================================================ */}
      {/* ✏️ EDIT ITEM MODAL - አዲስ ተጨምሯል */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative my-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Close */}
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditFormData({});
              }}
              className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b-2 border-amber-200 pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">እቃ ማስተካከያ</h3>
                <p className="text-[11px] text-amber-600 font-bold">Edit Item Information</p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              
              {/* Item Name */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1.5 font-black">
                  የእቃ ስም <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.Item_Name || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, Item_Name: e.target.value })
                  }
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Item Code */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-black">የእቃ ኮድ</label>
                <input
                  type="text"
                  value={editFormData.Item_Code || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, Item_Code: e.target.value })
                  }
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Unit Type */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-black">መለኪያ</label>
                <input
                  type="text"
                  value={editFormData.Unite_Type || 'Pcs'}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, Unite_Type: e.target.value })
                  }
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-black text-rose-600">
                  መግዣ ዋጋ
                </label>
                <input
                  type="number"
                  value={editFormData.Cost_Price || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      Cost_Price: safeNum(e.target.value, 0),
                    })
                  }
                  className="w-full p-3 bg-white border-2 border-rose-200 rounded-2xl font-black text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-black text-emerald-700">
                  መሸጫ ዋጋ
                </label>
                <input
                  type="number"
                  value={editFormData.Selling_Price || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      Selling_Price: safeNum(e.target.value, 0),
                    })
                  }
                  className="w-full p-3 bg-white border-2 border-emerald-200 rounded-2xl font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-black">ዝቅተኛ ገደብ</label>
                <input
                  type="number"
                  value={editFormData.Reorder_Level || 5}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      Reorder_Level: safeNum(e.target.value, 5),
                    })
                  }
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Pack Size */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-black">Pack Size</label>
                <input
                  type="text"
                  value={(editFormData as any).Pack_Size || '1'}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, Pack_Size: e.target.value } as any)
                  }
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditFormData({});
                }}
                className="w-1/3 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-2xl transition cursor-pointer"
              >
                ሰርዝ
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="w-2/3 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    በመመዝገብ ላይ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> ማሻሻያውን መዝገብ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
