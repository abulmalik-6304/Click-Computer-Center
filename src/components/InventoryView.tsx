'use client';

import { useState } from 'react';
import { 
  Boxes, 
  Filter, 
  Search, 
  PackageCheck, 
  Printer, 
  X, 
  Lock,
  TrendingUp,
  TrendingDown,
  Tag,
  DollarSign,
  Eye,
  Layers,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem, UserRole } from '../types';

interface Props {
  inventory: InventoryItem[];
  userRole: UserRole;
}

export default function InventoryView({ inventory, userRole }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const isEmployee = userRole === 'Employee';

  // Filter Logic
  const filteredInventory = inventory.filter((item) => {
    const qty = parseFloat(String(item.Stock_Quantity || item.Quantity_In_Stock || 0));
    const reorder = parseFloat(String(item.Reorder_Level || 5));

    if (filterType === 'low' && qty > reorder) return false;
    if (filterType === 'out' && qty > 0) return false;

    const term = searchTerm.toLowerCase();
    return (
      (item.Item_Name || '').toLowerCase().includes(term) ||
      (item.Item_Code || '').toLowerCase().includes(term)
    );
  });

  const lowStockCount = inventory.filter((i) => {
    const qty = parseFloat(String(i.Stock_Quantity || i.Quantity_In_Stock || 0));
    const reorder = parseFloat(String(i.Reorder_Level || 5));
    return qty > 0 && qty <= reorder;
  }).length;

  const outOfStockCount = inventory.filter((i) => {
    const qty = parseFloat(String(i.Stock_Quantity || i.Quantity_In_Stock || 0));
    return qty <= 0;
  }).length;

  const totalStockValue = inventory.reduce((a, c) => {
    const qty = parseFloat(String(c.Stock_Quantity || c.Quantity_In_Stock || 0));
    const cost = parseFloat(String(c.Cost_Price || 0));
    return a + qty * cost;
  }, 0);

  // Print Single Item
  const handlePrintItem = (item: InventoryItem) => {
    const win = window.open('', '', 'width=700,height=800');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Item Details - ${item.Item_Name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #2563eb; font-weight: bold; }
            .item-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
            .item-name { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 12px; }
            .label { font-weight: bold; color: #475569; }
            .value { font-weight: 900; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLICK COMPUTER CENTER</h1>
            <p>የእቃ ዝርዝር መረጃ (Item Details)</p>
          </div>
          <div class="item-card">
            <div class="item-name">${item.Item_Name}</div>
            <div class="info-row"><span class="label">የእቃ ኮድ (Code):</span><span class="value">${item.Item_Code || 'N/A'}</span></div>
            <div class="info-row"><span class="label">መለኪያ (Unit):</span><span class="value">${item.Unit_Type || 'Pcs'}</span></div>
            <div class="info-row"><span class="label">ያለው ስቶክ (Stock):</span><span class="value">${item.Stock_Quantity || item.Quantity_In_Stock || 0}</span></div>
            ${!isEmployee ? `
              <div class="info-row"><span class="label">የተገዛበት ዋጋ (Cost Price):</span><span class="value">${item.Cost_Price || 0} ብር</span></div>
              <div class="info-row"><span class="label">የሚሸጥበት ዋጋ (Selling Price):</span><span class="value">${item.Unit_Price || item.Selling_Price || 0} ብር</span></div>
            ` : ''}
            <div class="info-row"><span class="label">የተመዘገበበት ቀን:</span><span class="value">${new Date().toLocaleDateString('am-ET')}</span></div>
          </div>
          <p style="text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8;">
            ይህ ሰነድ ከ CLICK COMPUTER CENTER ሲስተም በራስ-ሰር የተዘጋጀ ነው።
          </p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">

      {/* ============================================================ */}
      {/* 🎯 HEADER WITH STATS */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Boxes className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">የስቶክ እቃዎች</h2>
              <p className="text-xs text-blue-100 font-bold mt-0.5">Stock Inventory Management</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-[10px] text-blue-100 font-bold uppercase">ጠቅላላ እቃዎች</p>
              <p className="text-lg font-black">{inventory.length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-[10px] text-amber-200 font-bold uppercase">ዝቅተኛ</p>
              <p className="text-lg font-black text-amber-300">{lowStockCount}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-[10px] text-rose-200 font-bold uppercase">አልቋል</p>
              <p className="text-lg font-black text-rose-300">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🔍 SEARCH & FILTERS */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="በስም ወይም በኮድ ፈልግ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> ሁሉም ({inventory.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'low' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> ዝቅተኛ ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'out' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <X className="w-3.5 h-3.5" /> አልቋል ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📦 CARDS GRID */}
      {/* ============================================================ */}
      {filteredInventory.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-black text-slate-800">ምንም እቃ አልተገኘም</h4>
          <p className="text-xs text-slate-400">የፈለጉትን እቃ ኮድ ወይም ስም አረጋግጠው እንደገና ይሞክሩ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredInventory.map((item, idx) => {
            const qty = parseFloat(String(item.Stock_Quantity || item.Quantity_In_Stock || 0));
            const reorder = parseFloat(String(item.Reorder_Level || 5));
            const isLow = qty > 0 && qty <= reorder;
            const isOut = qty <= 0;
            const imgSrc = item.Image || item.Photo || '/logo.png';
            const sellingPrice = parseFloat(String(item.Unit_Price || item.Selling_Price || 0));

            return (
              <div
                key={idx}
                onClick={() => setSelectedItem(item)}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer group relative"
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  {isOut ? (
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 font-black text-[9px] rounded-lg border border-rose-200 shadow-sm">
                      አልቋል
                    </span>
                  ) : isLow ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 font-black text-[9px] rounded-lg border border-amber-200 shadow-sm">
                      ዝቅተኛ
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] rounded-lg border border-emerald-200 shadow-sm">
                      በቂ
                    </span>
                  )}
                </div>

                {/* Image */}
                <div className="w-full h-36 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-3 overflow-hidden group-hover:scale-105 transition duration-300">
                  <img
                    src={imgSrc}
                    alt={item.Item_Name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e: any) => { e.target.src = '/logo.png'; }}
                  />
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                    {item.Item_Code || 'CODE-N/A'}
                  </span>
                  <h4 className="font-black text-xs text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                    {item.Item_Name}
                  </h4>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">ስቶክ</p>
                      <p className={`text-sm font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {qty} <span className="text-[9px] font-normal text-slate-400">{item.Unit_Type || 'Pcs'}</span>
                      </p>
                    </div>
                    {!isEmployee && (
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">ዋጋ</p>
                        <p className="text-sm font-black text-emerald-600">
                          {sellingPrice.toLocaleString()} <span className="text-[9px]">ብር</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 🔍 DETAILED ITEM MODAL */}
      {/* ============================================================ */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute right-4 top-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 shrink-0">
                  <img
                    src={selectedItem.Image || selectedItem.Photo || '/logo.png'}
                    alt={selectedItem.Item_Name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e: any) => { e.target.src = '/logo.png'; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg inline-block mb-1">
                    {selectedItem.Item_Code || 'CODE-N/A'}
                  </span>
                  <h3 className="text-xl font-black truncate">{selectedItem.Item_Name}</h3>
                  <p className="text-[11px] text-blue-100 font-bold mt-0.5">የስቶክ እቃ ዝርዝር መረጃ</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">

              {/* Stock Status Card */}
              <div className={`p-4 rounded-2xl border-2 ${
                (selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0) <= 0
                  ? 'bg-rose-50 border-rose-200'
                  : (selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0) <= (selectedItem.Reorder_Level || 5)
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0) <= 0 ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : (selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0) <= (selectedItem.Reorder_Level || 5) ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="text-xs font-black text-slate-700">
                      {(selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0) <= 0
                        ? 'አልቋል - አስቸኳይ ማዘዝ ያስፈልጋል'
                        : (selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0) <= (selectedItem.Reorder_Level || 5)
                        ? 'ዝቅተኛ ስቶክ - ማዘዝ ያስፈልጋል'
                        : 'በቂ ስቶክ አለ'}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">ያለው ስቶክ (Available Quantity)</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {selectedItem.Stock_Quantity || selectedItem.Quantity_In_Stock || 0}
                    <span className="text-sm ml-2 text-slate-500 font-bold">{selectedItem.Unit_Type || 'Pcs'}</span>
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">መለኪያ</span>
                  </div>
                  <p className="font-black text-slate-800 text-sm">{selectedItem.Unit_Type || 'Pcs'}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">ዝቅተኛ ገደብ</span>
                  </div>
                  <p className="font-black text-slate-800 text-sm">{selectedItem.Reorder_Level || 5}</p>
                </div>

                {/* Pricing - Restricted for Employees */}
                {isEmployee ? (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-800">
                      የዋጋ መረጃ ለሰራተኛ የተከለከለ ነው
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        <span className="text-[10px] font-bold text-rose-700 uppercase">መግዣ ዋጋ</span>
                      </div>
                      <p className="font-black text-rose-600 text-sm">
                        {parseFloat(String(selectedItem.Cost_Price || 0)).toLocaleString()} <span className="text-[10px]">ብር</span>
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">መሸጫ ዋጋ</span>
                      </div>
                      <p className="font-black text-emerald-600 text-sm">
                        {parseFloat(String(selectedItem.Unit_Price || selectedItem.Selling_Price || 0)).toLocaleString()} <span className="text-[10px]">ብር</span>
                      </p>
                    </div>

                    {/* Profit Margin */}
                    <div className="col-span-2 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-bold text-indigo-700 uppercase">የአንዱ ትርፍ</span>
                        </div>
                        <p className="font-black text-indigo-600 text-sm">
                          {(
                            parseFloat(String(selectedItem.Unit_Price || selectedItem.Selling_Price || 0)) -
                            parseFloat(String(selectedItem.Cost_Price || 0))
                          ).toLocaleString()} <span className="text-[10px]">ብር</span>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  ዝጋ
                </button>
                <button
                  onClick={() => handlePrintItem(selectedItem)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> ፕሪንት አድርግ
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
