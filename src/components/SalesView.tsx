'use client';

import { useState } from 'react';
import { ShoppingCart, Calendar, Printer, Filter, ReceiptText } from 'lucide-react';
import { SaleItem } from '../types';

interface Props {
  sales: SaleItem[];
}

export default function SalesView({ sales }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'today' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedReceipt, setSelectedReceipt] = useState<SaleItem | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAmharic = new Date().toLocaleDateString('am-ET');

  const filteredSales = sales.filter((s) => {
    const saleDate = s.Date || '';
    if (filterType === 'today') {
      return saleDate.includes(todayStr) || saleDate === todayAmharic;
    }
    if (filterType === 'custom') {
      return saleDate >= startDate && saleDate <= endDate;
    }
    return true;
  });

  const setTodayFilter = () => {
    setFilterType('custom');
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  return (
    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
      
      {/* HEADER & FILTER BAR */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-orange-500" /> የሽያጭ መዝገብ (Sales Records)
          </h3>
          <p className="text-xs text-slate-500 mt-1">የተሸጡ እቃዎችን ዝርዝር በፊልተር ይዩ እና ደረሰኝ ያውጡ</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 font-bold text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl transition ${filterType === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All (ሁሉም)
            </button>
            <button
              onClick={() => setFilterType('today')}
              className={`px-4 py-2 rounded-xl transition ${filterType === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today (የዛሬ)
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`px-4 py-2 rounded-xl transition ${filterType === 'custom' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Filter className="w-3.5 h-3.5 inline mr-1" /> በቀን መምረጫ
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs font-semibold">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-1.5 border rounded-lg" />
              <span>እስከ</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-1.5 border rounded-lg" />
              <button onClick={setTodayFilter} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold">
                Today
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SALES TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-4">ቀን (Date)</th>
              <th className="px-6 py-4">የእቃው ስም (Item)</th>
              <th className="px-6 py-4">ብዛት</th>
              <th className="px-6 py-4 text-right">ጠቅላላ ሂሳብ</th>
              <th className="px-6 py-4 text-center">ደረሰኝ (Receipt)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.map((sale, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-slate-500 font-medium">{sale.Date || 'N/A'}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{sale.Item_Name || 'እቃ'}</td>
                <td className="px-6 py-4 text-slate-600 font-semibold">{sale.Quantity || 1}</td>
                <td className="px-6 py-4 text-right font-black text-orange-500">
                  {(parseFloat(String(sale.Total_Price || 0))).toLocaleString()} ብር
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedReceipt(sale)}
                    className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-1 mx-auto"
                  >
                    <ReceiptText className="w-4 h-4" /> ደረሰኝ አውጣ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 relative">
            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-xl font-black text-slate-900">CLICK COMPUTER CENTER</h2>
              <p className="text-xs text-slate-500">Training, Maintenance & Sales Center</p>
              <p className="text-xs font-bold text-orange-500 mt-1">የሽያጭ ደረሰኝ (Sales Receipt)</p>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="flex justify-between"><span>ቀን፦</span><span>{selectedReceipt.Date}</span></div>
              <div className="flex justify-between"><span>የእቃው ስም፦</span><span className="font-bold text-slate-900">{selectedReceipt.Item_Name}</span></div>
              <div className="flex justify-between"><span>ብዛት፦</span><span>{selectedReceipt.Quantity || 1}</span></div>
              <div className="flex justify-between border-t pt-2 text-sm font-black text-slate-900">
                <span>ጠቅላላ ሂሳብ፦</span>
                <span className="text-orange-500">{(parseFloat(String(selectedReceipt.Total_Price || 0))).toLocaleString()} ብር</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> ደረሰኙን አትም (Print)
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-slate-100 text-slate-600 py-3 px-5 rounded-2xl font-bold text-xs hover:bg-slate-200"
              >
                ዝጋ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
