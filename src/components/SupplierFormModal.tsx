'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Search, 
  Phone, 
  MapPin, 
  Building, 
  Package, 
  UserPlus, 
  CheckCircle2,
  Printer,
  Send,
  MessageCircle,
  Mail,
  ArrowLeft,
  Calendar,
  User,
  Copy
} from 'lucide-react';
import { SupplierItem } from '../types';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierItem[];
  currentUserEmail: string;
}

export default function SupplierFormModal({
  isOpen,
  onClose,
  suppliers,
  currentUserEmail,
}: SupplierFormModalProps) {
  const [supplierList, setSupplierList] = useState<SupplierItem[]>(suppliers);
  const [searchQuery, setSearchQuery] = useState('');

  // 🆕 Detail View State
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // New Supplier Form States
  const [supplierName, setSupplierName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supplyItem, setSupplyItem] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    setSupplierList(suppliers);
  }, [suppliers]);

  if (!isOpen) return null;

  // Search Filter
  const filteredSuppliers = supplierList.filter((s) => {
    const name = s.Supplier_Name || (s as any).Name || '';
    const phone = s.Phone_Number || (s as any).Phone || '';
    const comp = s.Company_Name || (s as any).Company || '';
    const item = s.Supply_Item || '';

    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      comp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      alert('እባክዎን የአቅራቢውን ስም ያስገቡ!');
      return;
    }

    const newSup: SupplierItem = {
      Supplier_ID: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      Supplier_Name: supplierName,
      Phone_Number: phoneNumber,
      Company_Name: companyName,
      Supply_Item: supplyItem,
      Address: address,
      Recorded_By: currentUserEmail.split('@')[0],
    } as any;

    setSupplierList([newSup, ...supplierList]);

    alert(`አቅራቢ "${supplierName}" በስኬት ተመዝግቧል!`);

    setSupplierName('');
    setPhoneNumber('');
    setCompanyName('');
    setSupplyItem('');
    setAddress('');
  };

  // ============================================================
  // 🖨️ PRINT SUPPLIER DETAILS
  // ============================================================
  const handlePrintSupplier = (supplier: SupplierItem) => {
    const win = window.open('', '', 'width=800,height=700');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Supplier Details - ${supplier.Supplier_Name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #2563eb; font-weight: bold; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
            .name { font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
            .label { font-weight: bold; color: #475569; }
            .value { font-weight: 900; color: #0f172a; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLICK COMPUTER CENTER</h1>
            <p>የአቅራቢ ዝርዝር መረጃ (Supplier Details)</p>
          </div>
          <div class="card">
            <div class="name">${supplier.Supplier_Name}</div>
            <div class="info-row"><span class="label">🆔 ID:</span><span class="value">${supplier.Supplier_ID || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📞 ስልክ ቁጥር:</span><span class="value">${supplier.Phone_Number || 'N/A'}</span></div>
            <div class="info-row"><span class="label">🏢 ድርጅት ስም:</span><span class="value">${supplier.Company_Name || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📦 የሚያቀርበው እቃ:</span><span class="value">${supplier.Supply_Item || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📍 አድራሻ:</span><span class="value">${supplier.Address || 'N/A'}</span></div>
            <div class="info-row"><span class="label">👤 የመዘገበው:</span><span class="value">${(supplier as any).Recorded_By || 'N/A'}</span></div>
          </div>
          <div class="footer">
            ይህ ሰነድ ከ CLICK COMPUTER CENTER ሲስተም በራስ-ሰር የተዘጋጀ ነው።
            <br/>የተዘጋጀበት ቀን: ${new Date().toLocaleDateString('am-ET')}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ============================================================
  // 📱 SOCIAL MEDIA SHARE FUNCTIONS
  // ============================================================
  const cleanPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return '+251' + digits.slice(1);
    if (digits.startsWith('251')) return '+' + digits;
    return digits;
  };

  const handleSendSMS = (supplier: SupplierItem) => {
    const phone = cleanPhone(supplier.Phone_Number || '');
    const message = `ሰላም ${supplier.Supplier_Name}, ከ CLICK COMPUTER CENTER ነን።`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const handleCall = (supplier: SupplierItem) => {
    const phone = cleanPhone(supplier.Phone_Number || '');
    window.location.href = `tel:${phone}`;
  };

  const handleTelegram = (supplier: SupplierItem) => {
    const phone = cleanPhone(supplier.Phone_Number || '');
    const info = `📋 አቅራቢ: ${supplier.Supplier_Name}\n🏢 ድርጅት: ${supplier.Company_Name || 'N/A'}\n📞 ስልክ: ${phone}\n📦 እቃ: ${supplier.Supply_Item || 'N/A'}`;
    navigator.clipboard.writeText(info);
    alert('✅ የአቅራቢ መረጃ ተቀድቷል! ቴሌግራም ላይ ፔስት ያድርጉት።');
    window.open('https://t.me', '_blank');
  };

  const handleWhatsApp = (supplier: SupplierItem) => {
    const phone = cleanPhone(supplier.Phone_Number || '').replace('+', '');
    const message = `ሰላም ${supplier.Supplier_Name}, ከ CLICK COMPUTER CENTER ነን።`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleFacebook = (supplier: SupplierItem) => {
    window.open('https://www.facebook.com/messages', '_blank');
  };

  const handleCopyInfo = (supplier: SupplierItem) => {
    const info = `
📋 የአቅራቢ መረጃ
━━━━━━━━━━━━━━━━
👤 ስም: ${supplier.Supplier_Name}
🆔 ID: ${supplier.Supplier_ID || 'N/A'}
🏢 ድርጅት: ${supplier.Company_Name || 'N/A'}
📞 ስልክ: ${supplier.Phone_Number || 'N/A'}
📦 እቃ: ${supplier.Supply_Item || 'N/A'}
📍 አድራሻ: ${supplier.Address || 'N/A'}
━━━━━━━━━━━━━━━━
CLICK COMPUTER CENTER
    `.trim();
    navigator.clipboard.writeText(info);
    alert('✅ የአቅራቢ መረጃ ተቀድቷል!');
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 🏢 MAIN MODAL - SUPPLIER LIST + ADD FORM */}
      {/* ============================================================ */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-5xl w-full my-6 relative overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* MODAL HEADER */}
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-amber-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-wide">የአቅራቢ መዝገብ (Supplier Management)</h3>
                <p className="text-xs text-amber-300 font-bold">የእቃ አቅራቢዎች ዝርዝር እና አዲስ መመዝገቢያ</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODAL BODY - SPLIT VIEW LAYOUT */}
          <div className="p-6 overflow-y-auto flex-1 text-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT SIDE: SUPPLIER LIST & SEARCH */}
            <div className="lg:col-span-7 space-y-4 border-r border-slate-200 pr-0 lg:pr-6">
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="በአቅራቢ ስም፣ በድርጅት ወይም በስልክ ቁጥር ይፈልጉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* SUPPLIER CARDS LIST */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredSuppliers.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-xs font-bold text-slate-400">ምንም የተመዘገበ አቅራቢ አልተገኘም።</p>
                  </div>
                ) : (
                  filteredSuppliers.map((sup, idx) => {
                    const sName = sup.Supplier_Name || (sup as any).Name || 'N/A';
                    const sPhone = sup.Phone_Number || (sup as any).Phone || 'ስልክ የለውም';
                    const sComp = sup.Company_Name || (sup as any).Company || 'ድርጅት አልተጠቀሰም';
                    const sItem = sup.Supply_Item || 'እቃ አልተጠቀሰም';
                    const sAddr = sup.Address || 'አድራሻ የለውም';

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedSupplier(sup)}
                        className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-amber-400 hover:shadow-md transition space-y-2 cursor-pointer group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-amber-100 text-amber-700 font-black rounded-xl flex items-center justify-center text-sm group-hover:bg-amber-500 group-hover:text-white transition">
                              {sName.charAt(0) || 'S'}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition">
                                {sName}
                              </h4>
                              <span className="text-[10px] text-slate-400">ID: {sup.Supplier_ID || `SUP-${idx + 1}`}</span>
                            </div>
                          </div>

                          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Building className="w-3 h-3 text-amber-600" />
                            {sComp}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100 font-semibold">
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Package className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sItem}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5 truncate text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sAddr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT SIDE: NEW SUPPLIER FORM */}
            <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="border-b pb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-sm text-slate-900">አዲስ አቅራቢ መመዝገቢያ ፎርም</h4>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Supplier_Name (የአቅራቢው ስም) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="የአቅራቢውን ሙሉ ስም ይጻፉ..."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Phone_Number (ስልክ ቁጥር)
                  </label>
                  <input
                    type="tel"
                    placeholder="0911......"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Company_Name (የድርጅቱ ስም)
                  </label>
                  <input
                    type="text"
                    placeholder="የካምፓኒውን ስም ይጻፉ..."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Supply_Item (የሚያቀርበው እቃ)
                  </label>
                  <input
                    type="text"
                    placeholder="ምሳሌ፦ ፕሪንተር፣ ቶነር..."
                    value={supplyItem}
                    onChange={(e) => setSupplyItem(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Address (አድራሻ)
                  </label>
                  <input
                    type="text"
                    placeholder="ከተማ/ህንፃ..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> አቅራቢውን መዝግብ
                </button>

                <div className="text-[10px] text-slate-400 font-semibold text-center pt-2">
                  Recorded By: <span className="text-slate-700 font-bold">{currentUserEmail.split('@')[0]}</span>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🆕 DETAIL VIEW - SEPARATE MODAL (ከጀርባ ጥቁር ሻዶ አይኖረውም) */}
      {/* ============================================================ */}
      {selectedSupplier && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedSupplier(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden h-fit"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Detail Header */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>

              <button 
                onClick={() => setSelectedSupplier(null)}
                className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-full transition cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0 border-2 border-white/30">
                  {selectedSupplier.Supplier_Name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black truncate">{selectedSupplier.Supplier_Name}</h2>
                  <p className="text-[10px] text-amber-100 font-bold mt-0.5">
                    🆔 {selectedSupplier.Supplier_ID || 'N/A'}
                  </p>
                  {selectedSupplier.Company_Name && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/20 mt-1.5">
                      <Building className="w-2.5 h-2.5" />
                      {selectedSupplier.Company_Name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Body */}
            <div className="p-5 space-y-3">

              {/* Info Cards */}
              <div className="space-y-2">
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-blue-700 uppercase block">ስልክ</span>
                    <p className="font-black text-xs text-slate-900">
                      {selectedSupplier.Phone_Number || 'ስልክ የለውም'}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-amber-700 uppercase block">ድርጅት</span>
                    <p className="font-black text-xs text-slate-900 truncate">
                      {selectedSupplier.Company_Name || 'አልተጠቀሰም'}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-emerald-700 uppercase block">እቃ</span>
                    <p className="font-black text-xs text-slate-900">
                      {selectedSupplier.Supply_Item || 'አልተጠቀሰም'}
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-purple-700 uppercase block">አድራሻ</span>
                    <p className="font-black text-xs text-slate-900">
                      {selectedSupplier.Address || 'አድራሻ የለውም'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-slate-700 uppercase block">የመዘገበው</span>
                    <p className="font-black text-xs text-slate-900">
                      {(selectedSupplier as any).Recorded_By || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-black text-slate-500 uppercase block">
                  🚀 አክሽን ቁልፎች
                </span>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleCall(selectedSupplier)}
                    className="py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" /> ደውል
                  </button>
                  <button
                    onClick={() => handleSendSMS(selectedSupplier)}
                    className="py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> SMS
                  </button>
                  <button
                    onClick={() => handleWhatsApp(selectedSupplier)}
                    className="py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleTelegram(selectedSupplier)}
                    className="py-2 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Telegram
                  </button>
                  <button
                    onClick={() => handleFacebook(selectedSupplier)}
                    className="py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> Facebook
                  </button>
                  <button
                    onClick={() => handleCopyInfo(selectedSupplier)}
                    className="py-2 bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>

                <button
                  onClick={() => handlePrintSupplier(selectedSupplier)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> ፕሪንት አድርግ
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedSupplier(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> ወደ ዝርዝር ተመለስ
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
