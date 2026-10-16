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
  Users
} from 'lucide-react';

import { UserRole, SaleItem, InventoryItem, ExpenseItem, IncomeItem, CustomerItem, SupplierItem, UserAccount } from '../types';
import DashboardTab from '../components/DashboardTab';
import RecordsTab from '../components/RecordsTab';
import ReportsTab from '../components/ReportsTab';
import InventoryTab from '../components/InventoryTab';
import UserActivityTab from '../components/UserActivityTab';

// ✅ SignInCard Import
import { SignInCard, getDirectDriveImage } from '../components/SignInCard';

import SalesFormModal from '../components/SalesFormModal';
import IncomeFormModal from '../components/IncomeFormModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import CustomerFormModal from '../components/CustomerFormModal';
import SupplierFormModal from '../components/SupplierFormModal';
import InventoryFormModal from '../components/InventoryFormModal';
import UserFormModal from '../components/UserFormModal';

export default function ClickPerfectPortal() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [preselectedItem, setPreselectedItem] = useState<InventoryItem | null>(null);

  // Core Navigation Tabs
  const [mainNav, setMainNav] = useState<'dashboard' | 'records' | 'inventory' | 'reports' | 'users_activity'>('records');

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

  // ✅ NEW: SignInCard Login Handler
  const handleLoginFromCard = (email: string, role: string) => {
    const usersList: UserAccount[] = data?.users || [];
    const found = usersList.find(
      (u) => (u.User_Email || (u as any).Email)?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (found) {
      setCurrentUser(found);
    } else {
      setCurrentUser({ 
        User_Email: email, 
        Role: role as UserRole 
      });
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

  // ✅ NEW: Use SignInCard instead of inline form
  if (!isLoggedIn) {
    return <SignInCard onLogin={handleLoginFromCard} />;
  }

  const role = currentUser?.Role || 'Employee';
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
            <div className="bg-slate-100 p-2 pr-4 rounded-2xl border text-xs font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-slate-900">{currentUser?.User_Email}</p>
                <span className="text-orange-600 font-black text-[10px]">{role} Account</span>
              </div>
            </div>
            <button onClick={fetchData} className="bg-blue-600 text-white p-2.5 rounded-2xl hover:bg-blue-700"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setIsLoggedIn(false)} className="bg-rose-50 text-rose-600 border p-2.5 rounded-2xl hover:bg-rose-100"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        {/* CORE TABS NAVIGATION */}
        <div className="bg-slate-100 border-t w-full">
          <div className="w-full px-6 md:px-12 flex flex-wrap items-center gap-3 py-3">
            <button onClick={() => setMainNav('dashboard')} className={`px-6 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition ${mainNav === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><PieChart className="w-4 h-4 text-orange-400" /> ዳሽቦርድ</button>
            <button onClick={() => setMainNav('records')} className={`px-6 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition ${mainNav === 'records' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><FileSpreadsheet className="w-4 h-4 text-emerald-500" /> ዋና መዝገብ</button>
            <button onClick={() => setMainNav('inventory')} className={`px-6 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition ${mainNav === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><Boxes className="w-4 h-4 text-blue-500" /> የስቶክ እቃዎች</button>
            <button onClick={() => setMainNav('reports')} className={`px-6 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition ${mainNav === 'reports' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}><FileText className="w-4 h-4 text-purple-300" /> ሪፖርት</button>
            
            {isAdminOrOwner && (
              <button 
                onClick={() => setMainNav('users_activity')} 
                className={`px-6 py-2.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition ${
                  mainNav === 'users_activity' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-400" /> ሰራተኞችና አክቲቪቲ
              </button>
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

        {mainNav === 'users_activity' && isAdminOrOwner && (
          <UserActivityTab
            users={usersList}
            currentUserEmail={currentUser?.User_Email || ''}
            currentUserRole={role}
            onRefresh={fetchData}
          />
        )}
      </main>

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
