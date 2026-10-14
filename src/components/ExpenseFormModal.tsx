'use client';

import { useState, useEffect } from 'react';
import { X, Receipt, Calendar, CheckCircle2 } from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export default function ExpenseFormModal({
  isOpen,
  onClose,
  currentUserEmail,
}: ExpenseFormModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [category, setCategory] = useState<string>('🏢 የድርጅቱ ወጪ');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('🏢 የድርጅቱ ወጪ');
      setAmount('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert('እባክዎን ትክክለኛ የወጪ መጠን (Amount) ያስገቡ!');
      return;
    }

    const payload = {
      Date: date,
      Category: category,
      Amount: Number(amount),
      Description: description,
      Recorded_By: currentUserEmail, // Hidden email registration
    };

    console.log('New Expense Record Payload:', payload);
    alert(`የወጪ መዝገብ (${category} - ${amount} ብር) በስኬት ተመዝግቧል!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full my-8 relative overflow-hidden flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-rose-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-sm">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-wide">የወጪ መመዝገቢያ ፎርም (Expense Form)</h3>
              <p className="text-xs text-rose-300 font-bold">የመደብር፣ የቤትና የጋራ ወጪዎች መመዝገቢያ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800">
          
          {/* DATE FIELD WITH TODAY BUTTON INSIDE CALENDAR BLOCK */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" /> ቀን (Date)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl font-extrabold text-xs transition whitespace-nowrap"
              >
                Today
              </button>
            </div>
          </div>

          {/* CATEGORY DROPDOWN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Category (የወጪ ዓይነት)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="🏠 የቤት ወጪ">🏠 የቤት ወጪ</option>
              <option value="🌐 የማህበራዊ ወጪ">🌐 የማህበራዊ ወጪ</option>
              <option value="💵 ደመወዝ">💵 ደመወዝ</option>
              <option value="🚌 ትራንስፖርት">🚌 ትራንስፖርት</option>
              <option value="📶 የኢንተርኔት ወጪ">📶 የኢንተርኔት ወጪ</option>
              <option value="🏢 የድርጅቱ ወጪ">🏢 የድርጅቱ ወጪ</option>
            </select>
          </div>

          {/* AMOUNT INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Amount (የወጪ መጠን - ብር)
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Description (የወጪው ዝርዝር ምክንያት)
            </label>
            <textarea
              rows={3}
              placeholder="ለወጪው ዝርዝር መግለጫ እዚህ ይጻፉ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* FOOTER & HIDDEN RECORDED BY */}
          <div className="pt-4 flex justify-between items-center border-t border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold">
              Recorded By: <span className="text-slate-800 font-bold">{currentUserEmail}</span> (Hidden)
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                ሰርዝ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> ወጪውን መዝግብ (Save Expense)
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
