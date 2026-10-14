'use client';

import { X, Phone, Mail, MapPin, Truck, Package, Printer } from 'lucide-react';
import { SupplierItem, InventoryItem } from '../types';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierItem | null;
  allInventory: InventoryItem[];
}

export default function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
  allInventory,
}: SupplierDetailModalProps) {
  if (!isOpen || !supplier) return null;

  // የአቅራቢው ስም/ID
  const supplierId = supplier.Supplier_ID || (supplier as any).ID || '';
  const supplierName = supplier.Supplier_Name || (supplier as any).Name || supplierId;

  // ይህ አቅራቢ ያቀረባቸው እቃዎች
  const suppliedItems = allInventory.filter(
    (item) =>
      item.Supplier_ID === supplierId ||
      item.Supplier_ID === supplierName ||
      (item as any).Supplier_Name === supplierName
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{supplierName}</h3>
              <p className="text-xs text-slate-500">የአቅራቢ ፕሮፋይልና የቀረቡ እቃዎች መረጃ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-1">Supplier ID</span>
            <span className="font-black text-slate-800">{supplierId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> ስልክ ቁጥር
            </span>
            <span className="font-bold text-slate-800">{(supplier as any).Phone || (supplier as any).Contact || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> ኢሜይል / አድራሻ
            </span>
            <span className="font-bold text-slate-800">{(supplier as any).Email || (supplier as any).Address || 'N/A'}</span>
          </div>
        </div>

        {/* Supplied Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> ይህ አቅራቢ እስካሁን ያቀረባቸው እቃዎች ({suppliedItems.length})
            </h4>
          </div>

          {suppliedItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
              በዚህ አቅራቢ ስም የተመዘገበ እቃ የለም።
            </p>
          ) : (
            <div className="border rounded-2xl overflow-hidden divide-y text-xs">
              <div className="bg-slate-100 p-3 font-bold text-slate-600 grid grid-cols-4 gap-2">
                <span>የእቃ ስም</span>
                <span>የመሸጫ ዋጋ</span>
                <span>ያለው ስቶክ</span>
                <span>ኮድ</span>
              </div>
              {suppliedItems.map((item, idx) => (
                <div key={idx} className="p-3 grid grid-cols-4 gap-2 items-center hover:bg-slate-50 font-semibold text-slate-800">
                  <span className="font-bold">{item.Item_Name}</span>
                  <span className="text-emerald-600 font-bold">{parseFloat(String(item.Selling_Price || 0)).toLocaleString()} ብር</span>
                  <span>{item.Stock || 0} {item.Unite_Type || 'Pcs'}</span>
                  <span className="text-slate-400 text-[11px]">{item.Item_Code || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
