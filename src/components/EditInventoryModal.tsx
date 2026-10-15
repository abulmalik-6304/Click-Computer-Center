'use client';

import { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Save, AlertTriangle, Boxes } from 'lucide-react';
import { InventoryItem } from '../types';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSaveUpdatedItem: (updatedItem: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export default function EditInventoryModal({
  isOpen,
  onClose,
  item,
  onSaveUpdatedItem,
  onDeleteItem,
}: EditInventoryModalProps) {
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [unitType, setUnitType] = useState('Piece/ Single');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setItemName(item.Item_Name || '');
      setItemCode(item.Item_Code || item.Item_ID || '');
      setItemCostPrice(Number(item.Cost_Price) || '');
      setSellingPrice(Number(item.Selling_Price) || '');
      setReorderLevel(Number(item.Reorder_Level) || 5);
      setUnitType(item.Unite_Type || (item as any).Unit_Type || 'Piece/ Single');
    }
  }, [item]);

  const setItemCostPrice = (val: number | '') => setCostPrice(val);

  if (!isOpen || !item) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: InventoryItem = {
      ...item,
      Item_Name: itemName,
      Item_Code: itemCode,
      Cost_Price: Number(costPrice) || 0,
      Selling_Price: Number(sellingPrice) || 0,
      Reorder_Level: Number(reorderLevel) || 5,
      Unite_Type: unitType,
      Unit_Type: unitType,
    } as any;

    onSaveUpdatedItem(updated);
    onClose();
  };

  const handleDeleteClick = () => {
    if (confirm(`⚠️ እርግጠኛ xcuserdata "${itemName}" የሚለውን እቃ ሙሉ በሙሉ መሰረዝ ትፈልጋለህ?`)) {
      setIsDeleting(true);
      const targetId = item.Item_Code || item.Item_ID || '';
      onDeleteItem(targetId);
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">ዕቃ ማስተካከያ (Edit Inventory Item)</h3>
              <p className="text-[11px] text-slate-500 font-bold">ኮድ: {itemCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">የእቃው ስም (Item Name)</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase mb-1 text-rose-600">መግዣ ዋጋ (Cost Price)</label>
              <input
                type="number"
                min="0"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border-2 border-rose-200 rounded-xl text-xs font-black text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase mb-1 text-emerald-700">መሸጫ ዋጋ (Selling Price)</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border-2 border-emerald-200 rounded-xl text-xs font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">የመለኪያ ዓይነት (Unit Type)</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Piece/ Single">በቁጥር (Pcs)</option>
                <option value="Set">በስብስብ (Set)</option>
                <option value="Pack">በፓኬት (Pack)</option>
                <option value="Carton">በካርቶን (Carton)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">ዝቅተኛ ገደብ (Reorder Level)</label>
              <input
                type="number"
                min="1"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value) || 1)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteClick}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> መሰረዝ (Delete)
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ይቅር
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> ለውጦችን መዝግብ
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
