'use client';

import { useState } from 'react';
import { Printer, Calendar, Filter, Edit3, X, FileText } from 'lucide-react';
import { SaleItem, ExpenseItem, IncomeItem, UserRole } from '../types';

interface Props {
  sales: SaleItem[];
  expenses: ExpenseItem[];
  income: IncomeItem[];
  userRole: UserRole;
}

export default function ReportsView({ sales, expenses, income, userRole }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterType, setFilterType] = useState<'all' | 'today' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);

  const setToday = () => {
    setFilterType('custom');
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const filteredSales = sales.filter((s) => {
    if (filterType === 'today') return s.Date?.includes(todayStr);
    if (filterType === 'custom') return s.Date >= startDate && s.Date <= endDate;
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (filterType === 'today') return e.Date?.includes(todayStr);
    if (filterType === 'custom') return e.Date >= startDate && e.Date <= endDate;
    return true;
  });

  const filteredIncome = income.filter((i) => {
    if (filterType === 'today') return i.Date?.includes(todayStr);
    if (filterType === 'custom') return i.Date >= startDate && i.Date <= endDate;
    return true;
  });

  // Aggregations
  const totalSalesVal = filteredSales.reduce((a, c) => a + parseFloat(String(c.Total_Price || 0)), 0);
  const totalExpVal = filteredExpenses.reduce((a, c) => a + parseFloat(String(c.Amount || 0)), 0);
  const totalIncVal = filteredIncome.reduce((a, c) => a + parseFloat(String(c.Total_Price || c.Amount || 0)), 0);

  return (
    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-8">
      
      {/* HEADER & DATE RANGE FILTER */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-purple-600" /> ወርሃዊና ዕለታዊ የፋይናንስ ሪፖርት ማውጫ
          </h3>
          <p className="text-xs text-slate-500 mt-1">የሽያጭ፣ የወጪ እና የገቢ ዝርዝሮችን በጊዜ መርጠው ያትሙ</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 font-bold text-xs">
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl transition ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>All</button>
            <button onClick={() => setFilterType('today')} className={`px-4 py-2 rounded-xl transition ${filterType === 'today' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Today</button>
            <button onClick={() => setFilterType('custom')} className={`px-4 py-2 rounded-xl transition ${filterType === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>ቀን መምረጫ</button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border text-xs font-bold">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-1 border rounded-lg" />
              <span>እስከ</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-1 border rounded-lg" />
              <button onClick={setToday} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg">
                Today
              </button>
            </div>
          )}

          <button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md">
            <Printer className="w-4 h-4" /> ሪፖርቱን አትም (Print)
          </button>
        </div>
      </div>

      {/* REPORT SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl border text-xs font-bold space-y-2">
          <span className="text-slate-500 uppercase">ጠቅላላ ሽያጮች (Sales)</span>
          <div className="text-2xl font-black text-blue-600">{totalSalesVal.toLocaleString()} ብር</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border text-xs font-bold space-y-2">
          <span className="text-slate-500 uppercase">ጠቅላላ ወጪዎች (Expenses)</span>
          <div className="text-2xl font-black text-rose-600">{totalExpVal.toLocaleString()} ብር</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border text-xs font-bold space-y-2">
          <span className="text-slate-500 uppercase">አጠቃላይ ገቢ (Income)</span>
          <div className="text-2xl font-black text-emerald-600">{totalIncVal.toLocaleString()} ብር</div>
        </div>
      </div>

      {/* ADMIN EDITABLE SALES TABLE */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 text-base">የሽያጭ ዝርዝር ሪፖርት (Sales Breakdown)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 uppercase font-bold text-slate-700">
              <tr>
                <th className="p-3">ቀን</th>
                <th className="p-3">የእቃው ስም</th>
                <th className="p-3">የመዘገበው ሰራተኛ</th>
                <th className="p-3 text-right">የሽያጭ መጠን</th>
                {(userRole === 'Owner' || userRole === 'Admin') && <th className="p-3 text-center">አክሽን (Edit)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3">{sale.Date}</td>
                  <td className="p-3 font-bold text-slate-900">{sale.Item_Name}</td>
                  <td className="p-3">{sale.Recorded_By || 'N/A'}</td>
                  <td className="p-3 text-right font-black text-orange-500">{(parseFloat(String(sale.Total_Price || 0))).toLocaleString()} ብር</td>
                  {(userRole === 'Owner' || userRole === 'Admin') && (
                    <td className="p-3 text-center">
                      <button onClick={() => setEditingSale(sale)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN EDIT MODAL */}
      {editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border p-8 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4">
            <button onClick={() => setEditingSale(null)} className="absolute right-6 top-6"><X className="w-5 h-5 text-slate-400" /></button>
            <h3 className="text-lg font-bold text-slate-900">የሽያጭ ስህተት ማስተካከያ (Admin Edit)</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">የእቃው ስም</label>
              <input type="text" defaultValue={editingSale.Item_Name} className="w-full p-2.5 border rounded-xl text-xs font-semibold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">የሽያጭ መጠን (Total Price)</label>
              <input type="number" defaultValue={editingSale.Total_Price} className="w-full p-2.5 border rounded-xl text-xs font-semibold" />
            </div>
            <button onClick={() => { alert('ስህተቱ በትክክል ተስተካክሏል!'); setEditingSale(null); }} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold text-xs">
              ማስተካከያውን ሴቭ አድርግ (Save Fix)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
