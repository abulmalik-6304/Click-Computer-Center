'use client';

import { useState } from 'react';
import { PlusCircle, Boxes, Receipt, DollarSign, UserCheck, Truck, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  userRole: UserRole;
  inventoryList: any[];
}

export default function FormsView({ userRole, inventoryList }: Props) {
  const [activeForm, setActiveForm] = useState<'inventory' | 'income' | 'expense' | 'customer' | 'supplier' | 'user'>('inventory');

  return (
    <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <PlusCircle className="w-7 h-7 text-orange-500" /> የመመዝገቢያ ፎርሞች (Registration Forms)
        </h3>
        <p className="text-xs text-slate-500 mt-1">የሚፈልጉትን የመዝገብ ዓይነት መርጠው በስርዓት ይመዝግቡ</p>
      </div>

      {/* FORM SELECTOR TABS */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-2xl font-bold text-xs">
        <button onClick={() => setActiveForm('inventory')} className={`px-4 py-2.5 rounded-xl transition ${activeForm === 'inventory' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>1. እቃ መዝገብ</button>
        <button onClick={() => setActiveForm('income')} className={`px-4 py-2.5 rounded-xl transition ${activeForm === 'income' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>2. ገቢ መዝገብ</button>
        <button onClick={() => setActiveForm('expense')} className={`px-4 py-2.5 rounded-xl transition ${activeForm === 'expense' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>3. ወጭ መዝገብ</button>
        <button onClick={() => setActiveForm('customer')} className={`px-4 py-2.5 rounded-xl transition ${activeForm === 'customer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>4. ደንበኛ መዝገብ</button>
        <button onClick={() => setActiveForm('supplier')} className={`px-4 py-2.5 rounded-xl transition ${activeForm === 'supplier' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>5. አቅራቢ መዝገብ</button>
        {(userRole === 'Owner' || userRole === 'Admin') && (
          <button onClick={() => setActiveForm('user')} className={`px-4 py-2.5 rounded-xl transition ${activeForm === 'user' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600'}`}>6. ዩዘር መዝገብ (Admin)</button>
        )}
      </div>

      {/* DYNAMIC FORM BODY */}
      <form onSubmit={(e) => { e.preventDefault(); alert('መረጃው በስኬት ተመዝግቧል!'); }} className="space-y-6">
        
        {/* 1. Inventory Form */}
        {activeForm === 'inventory' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2">የእቃ መዝገብ (Inventory Registration)</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">የእቃው ስም (Item Name)</label>
              <input type="text" list="items-list" placeholder="የእቃው ስም ይጻፉ" className="w-full p-3 border rounded-xl text-xs font-semibold" />
              <datalist id="items-list">
                {inventoryList.map((i, idx) => <option key={idx} value={i.Item_Name} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">የተገዛበት ዋጋ</label>
                <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl text-xs font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">የሚሸጥበት ዋጋ</label>
                <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl text-xs font-semibold" />
              </div>
            </div>
          </div>
        )}

        {/* 2. Income Form */}
        {activeForm === 'income' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2">የገቢ መዝገብ (Income Registration)</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">income_source (የገቢ ዓይነት)</label>
              <select className="w-full p-3 border rounded-xl text-xs font-semibold">
                <option value="ጥገና/maintain">ጥገና/maintain</option>
                <option value="ሕትመት/Printing">ሕትመት/Printing</option>
                <option value="አገልግሎት/Service">አገልግሎት/Service</option>
                <option value="3C Shop">3C Shop</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Material_Cost (የቁሳቁስ ወጪ)</label>
              <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl text-xs font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total_Price (ጠቅላላ ገቢ)</label>
              <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl text-xs font-semibold" />
            </div>
          </div>
        )}

        {/* 3. Expense Form */}
        {activeForm === 'expense' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2">የወጭ መዝገብ (Expense Registration)</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">የወጪ ዓይነት (Expense Category)</label>
              <select className="w-full p-3 border rounded-xl text-xs font-semibold">
                <option value="የመደብር ወጭ">የመደብር ወጭ</option>
                <option value="ደመወዝ">ደመወዝ</option>
                <option value="የኢንተርኔት ወጭ">የኢንተርኔት ወጭ</option>
                <option value="የድርጅቱ ወጭ">የድርጅቱ ወጭ</option>
                <option value="ትራንስፖርት">ትራንስፖርት</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (የወጪ መጠን)</label>
              <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl text-xs font-semibold" />
            </div>
          </div>
        )}

        {/* 4. Customer Form */}
        {activeForm === 'customer' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2">የደንበኛ መዝገብ (Customer Registration)</h4>
            <input type="text" placeholder="የደንበኛ ስም" className="w-full p-3 border rounded-xl text-xs font-semibold" />
            <input type="text" placeholder="ስልክ ቁጥር" className="w-full p-3 border rounded-xl text-xs font-semibold" />
          </div>
        )}

        {/* 5. Supplier Form */}
        {activeForm === 'supplier' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2">የአቅራቢ መዝገብ (Supplier Registration)</h4>
            <input type="text" placeholder="የአቅራቢ ድርጅት/ሰው ስም" className="w-full p-3 border rounded-xl text-xs font-semibold" />
            <input type="text" placeholder="ስልክ ቁጥር/አድራሻ" className="w-full p-3 border rounded-xl text-xs font-semibold" />
          </div>
        )}

        {/* 6. User Access Form */}
        {activeForm === 'user' && (userRole === 'Owner' || userRole === 'Admin') && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2">የዩዘር መዝገብ (User Access Registration)</h4>
            <input type="email" placeholder="የሰራተኛው ኢሜይል" className="w-full p-3 border rounded-xl text-xs font-semibold" />
            <select className="w-full p-3 border rounded-xl text-xs font-semibold">
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Owner">Owner</option>
            </select>
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-base shadow-lg transition">
          መረጃውን መዝግብ (Save Record)
        </button>
      </form>
    </div>
  );
}
