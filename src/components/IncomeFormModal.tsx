'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, Layers, Package, Calculator, CheckCircle2, Plus } from 'lucide-react';
import { InventoryItem } from '../types';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  currentUserEmail: string;
}

export default function IncomeFormModal({
  isOpen,
  onClose,
  inventory,
  currentUserEmail,
}: IncomeFormModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Basic Form States
  const [date, setDate] = useState<string>(todayStr);
  const [incomeSource, setIncomeSource] = useState<'ጥገና/ Maintain' | 'ሕትመት/ Printing' | 'አገልግሎት/ Service' | '3C Shop'>('ጥገና/ Maintain');
  const [incomeCategory, setIncomeCategory] = useState<string>('EPSON ፕሪንተር');
  
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');

  // Used Material Toggleable Section States
  const [showUsedMaterial, setShowUsedMaterial] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [costPriceMain, setCostPriceMain] = useState<number>(0);
  const [packSize, setPackSize] = useState<number>(1);
  const [usedQty, setUsedQty] = useState<number>(1);
  const [materialCost, setMaterialCost] = useState<number>(0);

  // Auto-Update Income Category Options based on Income Source
  useEffect(() => {
    if (incomeSource === 'ጥገና/ Maintain') {
      setIncomeCategory('EPSON ፕሪንተር');
    } else if (incomeSource === 'ሕትመት/ Printing') {
      setIncomeCategory('National ID');
    } else if (incomeSource === 'አገልግሎት/ Service') {
      setIncomeCategory('ንግድ ፈቃድ እድሳት');
    } else if (incomeSource === '3C Shop') {
      setIncomeCategory('የሱቅ የተለየ ገቢ');
    }
  }, [incomeSource]);

  // Handle Material Auto-Fill from Inventory
  const handleMaterialSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const found = inventory.find((i) => i.Item_ID === itemId || i.Item_Name === itemId);
    if (found) {
      setSelectedItemName(found.Item_Name);
      const cost = found.Cost_Price || 0;
      const pSize = (found as any).Pack_Size || 1;
      setCostPriceMain(cost);
      setPackSize(pSize);
      // Auto Calculate Material Cost
      setMaterialCost((cost / pSize) * usedQty);
    }
  };

  // Recalculate Material Cost when Used_Qty changes
  useEffect(() => {
    if (costPriceMain > 0) {
      const computedCost = (costPriceMain / (packSize || 1)) * usedQty;
      setMaterialCost(computedCost);
    }
  }, [usedQty, costPriceMain, packSize]);

  // Reset Form on Open
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setIncomeSource('ጥገና/ Maintain');
      setPrice(0);
      setQuantity(1);
      setDescription('');
      setShowUsedMaterial(false);
      setSelectedItemId('');
      setSelectedItemName('');
      setCostPriceMain(0);
      setPackSize(1);
      setUsedQty(1);
      setMaterialCost(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Live Calculations
  const totalPrice = price * quantity;
  const effectiveMaterialCost = showUsedMaterial ? materialCost : 0;
  const netIncome = Math.max(0, totalPrice - effectiveMaterialCost);

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('እባክዎን Description (መግለጫ) ያስገቡ! ይህ መረጃ አስፈላጊ ነው።');
      return;
    }

    const payload = {
      Date: date,
      Income_Source: incomeSource,
      Income_Category: incomeCategory,
      Price: price,
      Quantity: quantity,
      Total_Price: totalPrice,
      Used_Material: showUsedMaterial ? selectedItemName : 'None',
      Cost_Price_Maine: costPriceMain,
      Pack_Size: packSize,
      Used_Qty: usedQty,
      Material_Cost: effectiveMaterialCost,
      Description: description,
      Net_Income: netIncome,
      Recorded_By: currentUserEmail, // Hidden Email
    };

    console.log('New Income Record Payload:', payload);
    alert(`የገቢ መዝገብ (${incomeSource} - ${totalPrice} ብር) በስኬት ተመዝግቧል!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full my-8 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-wide">የገቢ መመዝገቢያ ፎርም (Income Form)</h3>
              <p className="text-xs text-emerald-400 font-bold">አገልግሎት፣ ጥገና፣ ሕትመትና የሱቅ ገቢዎች</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* DATE & TODAY BUTTON */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> ቀን (Date)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Today (የዛሬው ቀን ይሁን)
              </button>
            </div>
          </div>

          {/* INCOME SOURCE & DYNAMIC CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Income_Source (የገቢ ምንጭ)</label>
              <select
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value as any)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ጥገና/ Maintain">ጥገና/ Maintain</option>
                <option value="ሕትመት/ Printing">ሕትመት/ Printing</option>
                <option value="አገልግሎት/ Service">አገልግሎት/ Service</option>
                <option value="3C Shop">3C Shop</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Income_Category (ዝርዝር)</label>
              {incomeSource === 'ጥገና/ Maintain' && (
                <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold">
                  <option value="EPSON ፕሪንተር">EPSON ፕሪንተር</option>
                  <option value="Canon Copy ማሽን">Canon Copy ማሽን</option>
                  <option value="PC">PC</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Other">Other</option>
                </select>
              )}

              {incomeSource === 'ሕትመት/ Printing' && (
                <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold">
                  <option value="National ID">National ID</option>
                  <option value="ባነር">ባነር</option>
                  <option value="ስቲከር">ስቲከር</option>
                  <option value="ቲሸርት">ቲሸርት</option>
                  <option value="ማህተም">ማህተም</option>
                  <option value="መጽሔት">መጽሔት</option>
                  <option value="ኩፖን">ኩፖን</option>
                  <option value="መጥሪያ ካርድ">መጥሪያ ካርድ</option>
                  <option value="Other">Other</option>
                </select>
              )}

              {incomeSource === 'አገልግሎት/ Service' && (
                <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold">
                  <option value="ንግድ ፈቃድ እድሳት">ንግድ ፈቃድ እድሳት</option>
                  <option value="የፓስፖርት አገልግሎት">የፓስፖርት አገልግሎት</option>
                  <option value="አታችመንት/ኢሜል">አታችመንት/ኢሜል</option>
                  <option value="Other">Other</option>
                </select>
              )}

              {incomeSource === '3C Shop' && (
                <input
                  type="text"
                  readOnly
                  value="የሱቅ የተለየ ገቢ"
                  className="w-full p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* PRICE, QUANTITY & TOTAL PRICE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Price (የአንዱ ዋጋ)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Quantity (ብዛት)</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total_Price (ጠቅላላ)</label>
              <input
                type="number"
                readOnly
                value={totalPrice}
                className="w-full p-2.5 bg-slate-200 border border-slate-300 rounded-xl text-xs font-black text-emerald-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* TOGGLEABLE USED MATERIAL SECTION */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" /> Used_Material (ለስራው የወጣ ቁሳቁስ ካለ)
              </span>

              <button
                type="button"
                onClick={() => setShowUsedMaterial(!showUsedMaterial)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  showUsedMaterial ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {showUsedMaterial ? 'ቁሳቁስ የለውም (አጥፋ)' : '+ Used Material (ቁሳቁስ ጨምር)'}
              </button>
            </div>

            {/* EXPANDED USED MATERIAL INPUTS */}
            {showUsedMaterial && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Used_Material (ከእቃ መዝገብ ይምረጡ)
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleMaterialSelect(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="">-- ቁሳቁስ ይምረጡ --</option>
                    {inventory.map((item, idx) => (
                      <option key={idx} value={item.Item_ID || item.Item_Name}>
                        {item.Item_Name} (የአንዱ ዋና ዋጋ፦ {item.Cost_Price || 0} ብር)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Cost_Price_Maine</label>
                    <input
                      type="number"
                      readOnly
                      value={costPriceMain}
                      className="w-full p-2 bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pack_Size</label>
                    <input
                      type="number"
                      readOnly
                      value={packSize}
                      className="w-full p-2 bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Used_Qty (የወጣ ብዛት)</label>
                    <input
                      type="number"
                      min="1"
                      value={usedQty}
                      onChange={(e) => setUsedQty(parseInt(e.target.value) || 1)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Material_Cost (ወጪ)</label>
                    <input
                      type="number"
                      readOnly
                      value={materialCost}
                      className="w-full p-2 bg-rose-100 border border-rose-300 rounded-lg text-xs font-black text-rose-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPTION (REQUIRED) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Description (መግለጫ) <span className="text-rose-500 font-bold">* Required</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="ስለ ገቢው ዝርዝር መግለጫ እዚህ ይጻፉ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* LIVE NET INCOME CALCULATION BANNER */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Net_Income (የተጣራ ገቢ)፦</span>
              <p className="text-xs text-slate-300">ጠቅላላ ገቢ ({totalPrice} ብር) - የቁሳቁስ ወጪ ({effectiveMaterialCost} ብር)</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">{netIncome.toLocaleString()} ብር</span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold">
              Recorded By: <span className="text-slate-800 font-bold">{currentUserEmail}</span> (Hidden)
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs">
                ሰርዝ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> ገቢውን መዝግብ (Save Income)
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
