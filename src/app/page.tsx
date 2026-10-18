'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Boxes, 
  RefreshCw, 
  PieChart, 
  LogOut, 
  FileText, 
  User, 
  FileSpreadsheet,
  Users,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Settings,
  Search,
  Printer,
  SlidersHorizontal,
  Database,
  History
} from 'lucide-react';

import { UserRole, SaleItem, InventoryItem, ExpenseItem, IncomeItem, CustomerItem, SupplierItem, UserAccount } from '../types';
import Link from "next/link";
import RecordsTab from '../components/RecordsTab';
import ReportsTab from '../components/ReportsTab';
import InventoryTab from '../components/InventoryTab';
import UserActivityTab from '../components/UserActivityTab';

import SalesFormModal from '../components/SalesFormModal';
import IncomeFormModal from '../components/IncomeFormModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import CustomerFormModal from '../components/CustomerFormModal';
import SupplierFormModal from '../components/SupplierFormModal';
import InventoryFormModal from '../components/InventoryFormModal';
import UserFormModal from '../components/UserFormModal';

// Google Drive ምስል ማስተካከያ Helper
export const getDirectDriveImage = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=s1000`;
    }
  }
  return url;
};

export default function ClickPerfectPortal() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Login State
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [preselectedItem, setPreselectedItem] = useState<InventoryItem | null>(null);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Core Navigation Tabs (including the 2 new columns)
  const [mainNav, setMainNav] = useState<'dashboard' | 'records' | 'inventory' | 'reports' | 'sales_history_center' | 'database_control'>('dashboard');

  // Search & Filter state for Sales History Center
  const [historySearch, setHistorySearch] = useState('');

  // All Registration Modals Controls
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    const usersList: UserAccount[] = data?.users || [];
    const found = usersList.find(u => (u.User_Email || (u as any).Email)?.toLowerCase().trim() === emailInput.toLowerCase().trim());

    if (found) {
      if (emailInput.toLowerCase().includes('clickcomputercenter230') || emailInput.toLowerCase().includes('abdulmelik')) {
        found.Role = 'Owner';
      }
      setCurrentUser(found);
    } else {
      let role: UserRole = 'Employee';
      if (emailInput.toLowerCase().includes('owner') || emailInput.toLowerCase().includes('admin') || emailInput.toLowerCase().includes('clickcomputercenter230') || emailInput.toLowerCase().includes('abdulmelik')) {
        role = 'Owner';
      } else if (emailInput.toLowerCase().includes('tofik') || emailInput.toLowerCase().includes('tahar')) {
        role = 'Manager';
      }
      setCurrentUser({ User_Email: emailInput, Role: role });
    }
    setIsLoggedIn(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 text-slate-800">
        <div className="flex items-center gap-4 bg-white border p-8 rounded-3xl shadow-2xl">
          <RefreshCw className="animate-spin text-orange-500 w-9 h-9" />
          <div>
            <h3 className="text-xl font-black text-slate-900">CLICK COMPUTER CENTER</h3>
            <p className="text-xs text-slate-500 font-bold">ዳታቤዙን በመጫን ላይ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-t-orange-500 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-white border border-slate-200 p-2 rounded-2xl mx-auto mb-3 shadow-sm flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={70} height={70} className="object-contain" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">CLICK COMPUTER CENTER</h2>
            <p className="text-xs text-orange-600 font-extrabold mt-1">የሲስተም መግቢያ ገጽ (Sign In)</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">ኢሜይል (System Email)</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="clickcomputercenter230@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">የይለፍ ቃል (Password)</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-xs shadow-xl transition cursor-pointer">
              ወደ ሲስተሙ ግባ (Sign In)
            </button>
          </form>
        </div>
      </div>
    );
  }

  const role = (currentUser?.User_Email?.toLowerCase().includes('clickcomputercenter230') || currentUser?.User_Email?.toLowerCase().includes('abdulmelik')) ? 'Owner' : (currentUser?.Role || 'Employee');
  const isAdminOrOwner = role === 'Owner' || role === 'Admin';
  const isOwnerOrManager = role === 'Owner' || role === 'Manager';

  const salesList: SaleItem[] = data?.sales || [];
  const inventoryList: InventoryItem[] = data?.inventory || [];
  const expensesList: ExpenseItem[] = data?.expenses || [];
  const customersList: CustomerItem[] = data?.customers || [];
  const suppliersList: SupplierItem[] = data?.suppliers || [];
  const usersList: UserAccount[] = data?.users || [];
  const salesItemsList: any[] = data?.salesItems || [];
  const stockInList: any[] = data?.stockIn || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAmharic = new Date().toLocaleDateString('am-ET');

  const todaySalesItems = salesList.filter(s => s.Date?.includes(todayStr) || s.Date === todayAmharic);
  const todayExpenseItems = expensesList.filter(e => e.Date?.includes(todayStr) || e.Date === todayAmharic);

  const myTodaySalesVal = todaySalesItems
    .filter(s => (s.Recorded_By || (s as any).User_Email)?.toLowerCase().trim() === currentUser?.User_Email?.toLowerCase().trim())
    .reduce((a, c) => a + parseFloat(String(c.Total_Price || 0)), 0);

  const todaySalesTotal = todaySalesItems.reduce((a, c) => a + parseFloat(String(c.Total_Price || 0)), 0);
  const todayExpenseTotal = todayExpenseItems.reduce((a, c) => a + parseFloat(String(c.Amount || 0)), 0);
  const todayCostTotal = todaySalesItems.reduce((a, c) => a + parseFloat(String(c.Total_Cost_Amount || 0)), 0);
  const todayProfitTotal = todaySalesTotal - todayCostTotal - todayExpenseTotal;
  const totalItemsSoldVal = salesList.reduce((a, c) => a + parseFloat(String(c.Quantity || 1)), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col w-full">
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-b-orange-500 sticky top-0 z-30 w-full shadow-sm">
        <div className="w-full px-6 md:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Logo" width={52} height={52} className="object-contain" />
            <div>
              <h1 className="text-2xl font-black text-slate-900">CLICK COMPUTER <span className="text-orange-500">CENTER</span></h1>
              <p className="text-xs text-blue-600 font-extrabold">Training, Maintenance & Sales Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 👑 PROFILED USER CARD (Clickable to open Profile Settings) */}
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 p-2.5 pr-5 rounded-2xl border border-slate-200 text-xs font-bold flex items-center gap-3 transition cursor-pointer"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-orange-500">
                {currentUser?.Profile_Image ? (
                  <img src={getDirectDriveImage(currentUser.Profile_Image)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className="text-left">
                <p className="text-slate-900 font-black">{currentUser?.User_Email || 'አብዱልመሊክ'}</p>
                <span className="text-orange-600 font-black text-[10px] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  👑 {role} (Settings)
                </span>
              </div>
            </button>

            <button onClick={fetchData} className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition cursor-pointer" title="ዳታ አድስ"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setIsLoggedIn(false)} className="bg-rose-50 text-rose-600 border border-rose-200 p-3 rounded-2xl hover:bg-rose-100 transition cursor-pointer" title="ውጣ"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        {/* CORE TABS NAVIGATION (รวม 6 Tabs) */}
        <div className="bg-slate-100 border-t w-full">
          <div className="w-full px-6 md:px-12 flex flex-wrap items-center gap-3 py-3">
            <button onClick={() => setMainNav('dashboard')} className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${mainNav === 'dashboard' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><PieChart className="w-4 h-4 text-orange-200" /> ዳሽቦርድ</button>
            <button onClick={() => setMainNav('records')} className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${mainNav === 'records' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><FileSpreadsheet className="w-4 h-4 text-emerald-200" /> ዋና መዝገብ</button>
            <button onClick={() => setMainNav('inventory')} className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${mainNav === 'inventory' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><Boxes className="w-4 h-4 text-blue-200" /> የስቶክ እቃዎች</button>
            <button onClick={() => setMainNav('reports')} className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${mainNav === 'reports' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><FileText className="w-4 h-4 text-purple-200" /> ሪፖርት</button>
            
            {/* ➕ አዲስ አምድ 1፦ የሽያጭ ታሪክና የዳታ ማዕከል */}
            <button onClick={() => setMainNav('sales_history_center')} className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${mainNav === 'sales_history_center' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><History className="w-4 h-4 text-emerald-200" /> የሽያጭ ታሪክና ዳታ ማዕከል</button>

            {/* ➕ አዲስ አምድ 2፦ የዳታቤዝ እና ሲስተም ቁጥጥር (ለ Owner/Manager ብቻ) */}
            {isOwnerOrManager && (
              <button onClick={() => setMainNav('database_control')} className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${mainNav === 'database_control' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><Database className="w-4 h-4 text-indigo-200" /> የዳታቤዝ ቁጥጥር (Master Control)</button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT VIEW */}
      <main className="w-full px-6 md:px-12 py-8 flex-1">
        {mainNav === 'dashboard' && (
          <DashboardTab
            myTodaySalesVal={myTodaySalesVal}
            todaySalesTotal={todaySalesTotal}
            totalItemsSoldVal={totalItemsSoldVal}
            todayProfitTotal={todayProfitTotal}
            isOwnerOrManager={isOwnerOrManager}
            sales={salesList}
            expenses={expensesList}
            users={usersList}
          />
        )}

        {mainNav === 'records' && (
          <RecordsTab
            onOpenSales={() => { setPreselectedItem(null); setIsSalesModalOpen(true); }}
            onOpenIncome={() => setIsIncomeModalOpen(true)}
            onOpenExpense={() => setIsExpenseModalOpen(true)}
            onOpenInventory={() => setIsInventoryModalOpen(true)}
            onOpenCustomer={() => setIsCustomerModalOpen(true)}
            onOpenSupplier={() => setIsSupplierModalOpen(true)}
            onOpenUser={() => setIsUserModalOpen(true)}
            isAdminOrOwner={isAdminOrOwner}
          />
        )}

        {mainNav === 'inventory' && (
          <InventoryTab
            inventory={inventoryList}
            sales={salesList}
            stockInList={stockInList}
            suppliers={suppliersList}
            currentUserRole={role}
            currentUserEmail={currentUser?.User_Email || 'clickcomputercenter230@gmail.com'}
            onOpenAddModal={() => setIsInventoryModalOpen(true)}
            onOpenSalesWithItem={(item) => {
              setPreselectedItem(item);
              setIsSalesModalOpen(true);
            }}
          />
        )}

        {mainNav === 'reports' && (
          <ReportsTab
            sales={salesList}
            income={data?.income || []}
            expenses={expensesList}
            inventory={inventoryList}
            salesItemsList={salesItemsList}
            users={usersList}
            currentUserRole={role}
            currentUserEmail={currentUser?.User_Email || ''}
          />
        )}

        {/* 📋 አዲስ አምድ 1 ገጽ፦ የሽያጭ ታሪክና የዳታ ማዕከል (Search, Filter, Export, Print) */}
        {mainNav === 'sales_history_center' && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">📜 የሽያጭ ታሪክ እና የዳታ ማዕከል (Sales History & Data Center)</h3>
                <p className="text-xs text-slate-500 font-bold">የሰራተኞችን ሽያጮች መመልከቻ፣ መፈለጊያ እና ማተሚያ ክፍል</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="በእቃ ስም፣ በደንበኛ ወይም በኢሜይል ፈልግ..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> ፕሪንት / ሪፖርት
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-black">
                  <tr>
                    <th className="p-3.5">ቀን (Date)</th>
                    <th className="p-3.5">ዕቃ / አገልግሎት</th>
                    <th className="p-3.5">ብዛት</th>
                    <th className="p-3.5">አጠቃላይ ዋጋ</th>
                    <th className="p-3.5">የከፈለው ደንበኛ</th>
                    <th className="p-3.5">መዝገቡን የያዘው (Staff)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {salesList
                    .filter(s => {
                      if (!historySearch) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        s.Item_Name?.toLowerCase().includes(q) ||
                        s.Customer_Name?.toLowerCase().includes(q) ||
                        s.Recorded_By?.toLowerCase().includes(q)
                      );
                    })
                    .map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 text-slate-500 font-bold">{s.Date}</td>
                        <td className="p-3.5 font-black text-slate-900">{s.Item_Name || 'N/A'}</td>
                        <td className="p-3.5">{s.Quantity || 1}</td>
                        <td className="p-3.5 font-black text-emerald-600">{Number(s.Total_Price || 0).toLocaleString()} ብር</td>
                        <td className="p-3.5">{s.Customer_Name || 'መደበኛ'}</td>
                        <td className="p-3.5 text-blue-600 font-bold">{s.Recorded_By || 'ሰዎች'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ⚙️ አዲስ አምድ 2 ገጽ፦ የዳታቤዝ እና ሲስተም ቁጥጥር (Master Control Panel for Owner) */}
        {mainNav === 'database_control' && isOwnerOrManager && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">⚙️ የዳታቤዝ እና ሲስተም ዋና ቁጥጥር (Master Control Panel)</h3>
                <p className="text-xs text-slate-500 font-bold">ሁሉንም የስርዓት ህጎች፣ ተጠቃሚዎች እና የ Google Sheets ግንኙነት ማስተካከያ</p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-xs font-black">
                👑 Owner Access Only
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> ተጠቃሚዎች አስተዳደር
                </h4>
                <p className="text-xs text-slate-500">የሰራተኞችን ሚና (Role) መቀየር እና አዳዲስ አካውንቶችን መፍጠር።</p>
                <button 
                  onClick={() => setIsUserModalOpen(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition cursor-pointer"
                >
                  ሰራተኞችን ያስተዳድሩ
                </button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" /> Google Sheets Sync
                </h4>
                <p className="text-xs text-slate-500">ዳታቤዙ ከ Google Sheets ጋር በትክክል መገናኘቱን ማረጋገጫ።</p>
                <button 
                  onClick={fetchData}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer"
                >
                  ሺቱን አሁኑኑ አድስ (Sync Now)
                </button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" /> የደህንነት ቅንብሮች
                </h4>
                <p className="text-xs text-slate-500">የሲስተም ፓስወርድ እና የባለቤትነት መብት ጥበቃ።</p>
                <span className="block text-center py-2 bg-orange-50 text-orange-700 font-black rounded-xl text-xs border border-orange-200">
                  አክቲቭ እና ሴኪዩር (Secure)
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 👤 PROFILE SETTINGS MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-base font-black text-slate-900">የአካውንት እና ፕሮፋይል ሴቲንግ (Profile Settings)</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl mx-auto flex items-center justify-center overflow-hidden border-2 border-orange-500">
                  {currentUser?.Profile_Image ? (
                    <img src={getDirectDriveImage(currentUser.Profile_Image)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-orange-600" />
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900">{currentUser?.User_Email}</h4>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 font-black rounded-full text-[10px]">
                  👑 {role} Account
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">የፕሮፋይል ፎቶ ሊንክ (Google Drive Image URL)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/..."
                  defaultValue={currentUser?.Profile_Image || ''}
                  onChange={(e) => {
                    if (currentUser) {
                      setCurrentUser({ ...currentUser, Profile_Image: e.target.value });
                    }
                  }}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer"
                >
                  አስቀምጥ (Save)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL REGISTRATION MODALS */}
      <SalesFormModal
        isOpen={isSalesModalOpen}
        onClose={() => {
          setIsSalesModalOpen(false);
          setPreselectedItem(null);
        }}
        customers={customersList}
        inventory={inventoryList}
        currentUserEmail={currentUser?.User_Email || ''}
        onOpenCustomerModal={() => { setIsSalesModalOpen(false); setIsCustomerModalOpen(true); }}
        preselectedItem={preselectedItem}
      />
      
      <IncomeFormModal 
        isOpen={isIncomeModalOpen} 
        onClose={() => setIsIncomeModalOpen(false)} 
        inventory={inventoryList} 
        currentUserEmail={currentUser?.User_Email || ''} 
        onOpenInventoryModal={() => { setIsIncomeModalOpen(false); setIsInventoryModalOpen(true); }} 
      />

      <ExpenseFormModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        currentUserEmail={currentUser?.User_Email || ''} 
      />

      <CustomerFormModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        customers={customersList} 
        currentUserEmail={currentUser?.User_Email || ''} 
      />

      <SupplierFormModal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        suppliers={suppliersList} 
        currentUserEmail={currentUser?.User_Email || ''} 
      />

      <InventoryFormModal 
        isOpen={isInventoryModalOpen} 
        onClose={() => setIsInventoryModalOpen(false)} 
        inventory={inventoryList} 
        suppliers={suppliersList} 
        currentUserEmail={currentUser?.User_Email || ''} 
        onOpenSupplierModal={() => { setIsInventoryModalOpen(false); setIsSupplierModalOpen(true); }} 
        salesItemsList={salesItemsList}
        stockInList={stockInList}
      />

      <UserFormModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        users={usersList} 
        currentUserEmail={currentUser?.User_Email || ''} 
        currentUserRole={role} 
        onRefresh={fetchData} 
      />

    </div>
  );
}
