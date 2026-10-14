'use client';

import { 
  ShoppingBag, 
  TrendingUp, 
  Receipt, 
  Boxes, 
  Users, 
  Truck, 
  UserPlus, 
  PlusCircle,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';

interface RecordsTabProps {
  onOpenSales: () => void;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
  onOpenInventory: () => void;
  onOpenCustomer: () => void;
  onOpenSupplier: () => void;
  onOpenUser: () => void;
  isAdminOrOwner: boolean;
}

export default function RecordsTab({
  onOpenSales,
  onOpenIncome,
  onOpenExpense,
  onOpenInventory,
  onOpenCustomer,
  onOpenSupplier,
  onOpenUser,
  isAdminOrOwner,
}: RecordsTabProps) {
  
  const recordCards = [
    {
      title: 'የሽያጭ መዝገብ',
      subtitle: 'Sales Form',
      desc: 'የእቃ፣ የካርድ እና የላፕቶፕ/መለዋወጫ ሽያጮችን ይመዝግቡ',
      icon: ShoppingBag,
      gradient: 'from-orange-500 to-amber-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      textColor: 'text-orange-600',
      onClick: onOpenSales,
    },
    {
      title: 'የሌሎች ገቢዎች መዝገብ',
      subtitle: 'Income Form',
      desc: 'የስልጠና፣ የጥገና፣ የፎቶኮፒ እና የዲዛይን ገቢዎችን ይመዝግቡ',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-blue-600',
      onClick: onOpenIncome,
    },
    {
      title: 'የወጪዎች መዝገብ',
      subtitle: 'Expense Form',
      desc: 'የሱቅ ኪራይ፣ የሰራተኛ ደሞዝ፣ የመብራትና የትራንስፖርት ወጪዎች',
      icon: Receipt,
      gradient: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      textColor: 'text-rose-600',
      onClick: onOpenExpense,
    },
    {
      title: 'የስቶክ እቃዎች ማዕከል',
      subtitle: 'Inventory Center',
      desc: 'አዲስ የመጡ እቃዎችን መዝግበው ወደ ስቶክ ያስገቡ (List, Edit, Delete)',
      icon: Boxes,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-600',
      onClick: onOpenInventory,
    },
    {
      title: 'የደንበኞች መዝገብ',
      subtitle: 'Customer Management',
      desc: 'የደንበኞችን ስም፣ ስልክ፣ ኢሜይል እና አድራሻ ያስተዳድሩ (List, Edit, Delete)',
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-600',
      onClick: onOpenCustomer,
    },
    {
      title: 'የአቅራቢዎች መዝገብ',
      subtitle: 'Supplier Management',
      desc: 'ዕቃ የሚያቀርቡልዎትን ድርጅቶችና አቅራቢዎች ያስተዳድሩ (List, Edit, Delete)',
      icon: Truck,
      gradient: 'from-indigo-500 to-purple-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      textColor: 'text-indigo-600',
      onClick: onOpenSupplier,
    },
  ];

  if (isAdminOrOwner) {
    recordCards.push({
      title: 'የሲስተም ተጠቃሚዎች',
      subtitle: 'Admin Dashboard',
      desc: 'ለሰራተኞች እና ማኔጀሮች የሲስተም መግቢያ ፍቃድ ይስጡ (List, Edit, Delete)',
      icon: UserPlus,
      gradient: 'from-purple-500 to-fuchsia-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      textColor: 'text-purple-600',
      onClick: onOpenUser,
    });
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-3xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                ዋና መዝገብ (Registration Hub)
              </h2>
              <p className="text-sm text-emerald-100 font-bold mt-1">
                ሁሉንም የንግድ መረጃዎችዎን በአንድ ቦታ ያስተዳድሩ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <div className="text-xs font-bold">
              <p className="text-emerald-100">ጠቅላላ መዝገቦች</p>
              <p className="text-white text-base font-black">{recordCards.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recordCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`group relative bg-white border-2 ${card.border} hover:border-transparent rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 overflow-hidden`}
            >
              {/* Top gradient glow on hover */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className={`p-2 ${card.bg} ${card.textColor} rounded-full group-hover:scale-110 transition`}>
                  <PlusCircle className="w-5 h-5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 text-base group-hover:text-slate-800 transition">
                    {card.title}
                  </h3>
                </div>
                <p className={`text-[10px] font-black ${card.textColor} uppercase tracking-wider mb-2`}>
                  {card.subtitle}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className={`pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black ${card.textColor}`}>
                <span>መዝገቡን ክፈት</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
