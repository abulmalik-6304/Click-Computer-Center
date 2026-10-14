'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  UserPlus, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  DollarSign,
  ArrowLeft,
  Calendar,
  Users,
  Printer,
  Send,
  MessageCircle,
  Copy,
  User,
  FileText
} from 'lucide-react';
import { CustomerItem } from '../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerItem[];
  currentUserEmail: string;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  customers,
  currentUserEmail,
}: CustomerFormModalProps) {
  const [customerList, setCustomerList] = useState<CustomerItem[]>(customers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  // 🆕 Detail View State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // New Customer Form States
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerType, setCustomerType] = useState<'Cash Customer' | 'Credit Customer' | 'የድርጅት ደንበኛ'>('Cash Customer');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    setCustomerList(customers);
  }, [customers]);

  if (!isOpen) return null;

  // Filtered Customers Search & Type Filter
  const filteredCustomers = customerList.filter((c) => {
    const matchesSearch =
      c.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.Phone?.includes(searchQuery) ||
      c.Address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'All' || (c as any).Customer_Type === filterType;

    return matchesSearch && matchesType;
  });

  // Handle Add Customer Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('እባክዎን የደንበኛ ስም ያስገቡ!');
      return;
    }

    const newCust: CustomerItem = {
      Customer_ID: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      Name: customerName,
      Phone: phoneNumber,
      Address: address,
      Customer_Type: customerType,
      Customer_Email: customerEmail,
      Recorded_By: currentUserEmail.split('@')[0],
    } as any;

    setCustomerList([newCust, ...customerList]);

    alert(`ደንበኛ "${customerName}" በስኬት ተመዝግቧል!`);

    setCustomerName('');
    setPhoneNumber('');
    setCustomerType('Cash Customer');
    setCustomerEmail('');
    setAddress('');
  };

  // ============================================================
  // 🖨️ PRINT CUSTOMER DETAILS
  // ============================================================
  const handlePrintCustomer = (customer: CustomerItem) => {
    const win = window.open('', '', 'width=800,height=700');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Customer Details - ${customer.Name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; border-bottom: 3px solid #9333ea; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #2563eb; font-weight: bold; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
            .name { font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 20px; color: #0f172a; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
            .label { font-weight: bold; color: #475569; }
            .value { font-weight: 900; color: #0f172a; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLICK COMPUTER CENTER</h1>
            <p>የደንበኛ ዝርዝር መረጃ (Customer Details)</p>
          </div>
          <div class="card">
            <div class="name">${customer.Name}</div>
            <div class="info-row"><span class="label">🆔 ID:</span><span class="value">${customer.Customer_ID || 'N/A'}</span></div>
            <div class="info-row"><span class="label">📞 ስልክ ቁጥር:</span><span class="value">${customer.Phone || 'N/A'}</span></div>
            <div class="info-row"><span class="label">✉️ ኢሜይል:</span><span class="value">${(customer as any).Customer_Email || 'N/A'}</span></div>
            <div class="info-row"><span class="label">🏷️ ዓይነት:</span><span class="value">${(customer as any).Customer_Type || 'Cash Customer'}</span></div>
            <div class="info-row"><span class="label">📍 አድራሻ:</span><span class="value">${customer.Address || 'N/A'}</span></div>
            <div class="info-row"><span class="label">👤 የመዘገበው:</span><span class="value">${(customer as any).Recorded_By || 'N/A'}</span></div>
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

  const handleSendSMS = (customer: CustomerItem) => {
    const phone = cleanPhone(customer.Phone || '');
    const message = `ሰላም ${customer.Name}, ከ CLICK COMPUTER CENTER ነን።`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const handleCall = (customer: CustomerItem) => {
    const phone = cleanPhone(customer.Phone || '');
    window.location.href = `tel:${phone}`;
  };

  const handleTelegram = (customer: CustomerItem) => {
    const phone = cleanPhone(customer.Phone || '');
    const info = `📋 ደንበኛ: ${customer.Name}\n🏷️ ዓይነት: ${(customer as any).Customer_Type || 'Cash Customer'}\n📞 ስልክ: ${phone}\n📍 አድራሻ: ${customer.Address || 'N/A'}`;
    navigator.clipboard.writeText(info);
    alert('✅ የደንበኛ መረጃ ተቀድቷል! ቴሌግራም ላይ ፔስት ያድርጉት።');
    window.open('https://t.me', '_blank');
  };

  const handleWhatsApp = (customer: CustomerItem) => {
    const phone = cleanPhone(customer.Phone || '').replace('+', '');
    const message = `ሰላም ${customer.Name}, ከ CLICK COMPUTER CENTER ነን።`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = (customer: CustomerItem) => {
    const email = (customer as any).Customer_Email || '';
    if (!email) {
      alert('⚠️ ይህ ደንበኛ ኢሜይል የለውም!');
      return;
    }
    const subject = `ከ CLICK COMPUTER CENTER - ${customer.Name}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  };

  const handleCopyInfo = (customer: CustomerItem) => {
    const info = `
📋 የደንበኛ መረጃ
━━━━━━━━━━━━━━━━
👤 ስም: ${customer.Name}
🆔 ID: ${customer.Customer_ID || 'N/A'}
🏷️ ዓይነት: ${(customer as any).Customer_Type || 'Cash Customer'}
📞 ስልክ: ${customer.Phone || 'N/A'}
✉️ ኢሜይል: ${(customer as any).Customer_Email || 'N/A'}
📍 አድራሻ: ${customer.Address || 'N/A'}
━━━━━━━━━━━━━━━━
CLICK COMPUTER CENTER
    `.trim();
    navigator.clipboard.writeText(info);
    alert('✅ የደንበኛ መረጃ ተቀድቷል!');
  };

  // Helper: Type Badge
  const getTypeBadge = (type: string) => {
    if (type === 'Credit Customer')
      return { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <CreditCard className="w-3 h-3" /> };
    if (type === 'የድርጅት ደንበኛ')
      return { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <Building2 className="w-3 h-3" /> };
    return { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <DollarSign className="w-3 h-3" /> };
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 🏢 MAIN MODAL - CUSTOMER LIST + ADD FORM */}
      {/* ============================================================ */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-5xl w-full my-6 relative overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* MODAL HEADER */}
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-wide">የደንበኛ መዝገብ (Customer Management)</h3>
                <p className="text-xs text-purple-300 font-bold">የደንበኞች ዝርዝር እና አዲስ መመዝገቢያ</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODAL BODY - SPLIT VIEW LAYOUT */}
          <div className="p-6 overflow-y-auto flex-1 text-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT SIDE: CUSTOMER LIST & SEARCH */}
            <div className="lg:col-span-7 space-y-4 border-r border-slate-200 pr-0 lg:pr-6">
              
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="በስም፣ በስልክ ቁጥር ወይም በአድራሻ ይፈልጉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] font-bold">
                  {['All', 'Cash Customer', 'Credit Customer', 'የድርጅት ደንበኛ'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                        filterType === t ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t === 'All' ? 'ሁሉም ደንበኞች' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOMER CARDS LIST */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-xs font-bold text-slate-400">ምንም የተመዘገበ ደንበኛ አልተገኘም።</p>
                  </div>
                ) : (
                  filteredCustomers.map((cust, idx) => {
                    const type = (cust as any).Customer_Type || 'Cash Customer';
                    const badge = getTypeBadge(type);
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCustomer(cust)}
                        className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-purple-400 hover:shadow-md transition space-y-2 cursor-pointer group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-purple-100 text-purple-700 font-black rounded-xl flex items-center justify-center text-sm group-hover:bg-purple-600 group-hover:text-white transition">
                              {cust.Name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition">
                                {cust.Name}
                              </h4>
                              <span className="text-[10px] text-slate-400">ID: {cust.Customer_ID || `CUST-${idx + 1}`}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1 ${badge.color}`}>
                            {badge.icon}
                            {type}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100 font-semibold">
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 text-purple-500" />
                            <span>{cust.Phone || 'ስልክ የለውም'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-purple-500" />
                            <span>{cust.Address || 'አድራሻ የለውም'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT SIDE: NEW CUSTOMER REGISTRATION FORM */}
            <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="border-b pb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h4 className="font-extrabold text-sm text-slate-900">አዲስ ደንበኛ መመዝገቢያ ፎርም</h4>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Customer_Name (የደንበኛ ስም) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="የደንበኛውን ሙሉ ስም ይጻፉ..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Customer_Type (የደንበኛ ዓይነት)
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Cash Customer">Cash Customer</option>
                    <option value="Credit Customer">Credit Customer</option>
                    <option value="የድርጅት ደንበኛ">የድርጅት ደንበኛ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Customer_Email (ኢሜይል)
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Address (አድራሻ)
                  </label>
                  <input
                    type="text"
                    placeholder="ቦታ/ከተማ/ህንፃ..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> ደንበኛውን መዝግብ (Save Customer)
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
      {/* 🆕 DETAIL VIEW - SEPARATE MODAL (እንደ አቅራቢው ዘመናዊ) */}
      {/* ============================================================ */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden h-fit"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Detail Header */}
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>

              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-full transition cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0 border-2 border-white/30">
                  {selectedCustomer.Name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black truncate">{selectedCustomer.Name}</h2>
                  <p className="text-[10px] text-purple-100 font-bold mt-0.5">
                    🆔 {selectedCustomer.Customer_ID || 'N/A'}
                  </p>
                  {((selectedCustomer as any).Customer_Type) && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/20 mt-1.5">
                      {getTypeBadge((selectedCustomer as any).Customer_Type).icon}
                      {(selectedCustomer as any).Customer_Type}
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
                    <span className="text-[9px] font-black text-blue-700 uppercase block">ስልክ ቁጥር</span>
                    <p className="font-black text-xs text-slate-900">
                      {selectedCustomer.Phone || 'ስልክ የለውም'}
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-purple-700 uppercase block">ኢሜይል</span>
                    <p className="font-black text-xs text-slate-900 truncate">
                      {(selectedCustomer as any).Customer_Email || 'ኢሜይል የለውም'}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-emerald-700 uppercase block">አድራሻ</span>
                    <p className="font-black text-xs text-slate-900">
                      {selectedCustomer.Address || 'አድራሻ የለውም'}
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
                      {(selectedCustomer as any).Recorded_By || 'N/A'}
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
                    onClick={() => handleCall(selectedCustomer)}
                    className="py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" /> ደውል
                  </button>
                  <button
                    onClick={() => handleSendSMS(selectedCustomer)}
                    className="py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> SMS
                  </button>
                  <button
                    onClick={() => handleWhatsApp(selectedCustomer)}
                    className="py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleTelegram(selectedCustomer)}
                    className="py-2 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Telegram
                  </button>
                  <button
                    onClick={() => handleEmail(selectedCustomer)}
                    className="py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    onClick={() => handleCopyInfo(selectedCustomer)}
                    className="py-2 bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>

                <button
                  onClick={() => handlePrintCustomer(selectedCustomer)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-black text-[10px] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> ፕሪንት አድርግ
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCustomer(null)}
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
