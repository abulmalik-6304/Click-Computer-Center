'use client';

import { useState } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Boxes,
  Activity,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Target,
  BarChart3,
  Wallet,
  Package,
  Calendar,
  Zap,
  Eye
} from 'lucide-react';

interface DashboardTabProps {
  myTodaySalesVal: number;
  todaySalesTotal: number;
  totalItemsSoldVal: number;
  todayProfitTotal: number;
  isOwnerOrManager: boolean;
  sales?: any[];
  expenses?: any[];
  users?: any[];
}

export default function DashboardTab({
  myTodaySalesVal,
  todaySalesTotal,
  totalItemsSoldVal,
  todayProfitTotal,
  isOwnerOrManager,
  sales = [],
  expenses = [],
  users = [],
}: DashboardTabProps) {
  
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // ============================================================
  // 📊 CALCULATIONS
  // ============================================================
  const totalSalesAll = sales.reduce((a, c) => a + parseFloat(String(c.Total_Amount || c.Total_Price || 0)), 0);
  const totalExpensesAll = expenses.reduce((a, c) => a + parseFloat(String(c.Amount || 0)), 0);
  const totalCostAll = sales.reduce((a, c) => a + parseFloat(String(c.Total_Cost_Amount || 0)), 0);
  const netProfitAll = totalSalesAll - totalCostAll - totalExpensesAll;

  const profitMargin = totalSalesAll > 0 ? ((netProfitAll / totalSalesAll) * 100).toFixed(1) : '0';

  // Time-based filtering
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (timeRange === 'today') return today;
    if (timeRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    }
    if (timeRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    }
    return new Date(0); // All time
  };

  const dateFilter = getDateRange();
  const filterByDate = (item: any) => {
    if (timeRange === 'all') return true;
    const itemDate = new Date(item.Date || '');
    return itemDate >= dateFilter;
  };

  const filteredSales = sales.filter(filterByDate);
  const filteredExpenses = expenses.filter(filterByDate);

  const rangeSalesTotal = filteredSales.reduce((a, c) => a + parseFloat(String(c.Total_Amount || c.Total_Price || 0)), 0);
  const rangeExpensesTotal = filteredExpenses.reduce((a, c) => a + parseFloat(String(c.Amount || 0)), 0);
  const rangeCostTotal = filteredSales.reduce((a, c) => a + parseFloat(String(c.Total_Cost_Amount || 0)), 0);
  const rangeProfitTotal = rangeSalesTotal - rangeCostTotal - rangeExpensesTotal;

  // Top Selling Items (by qty)
  const itemSalesMap: { [key: string]: { qty: number; revenue: number } } = {};
  sales.forEach((s) => {
    const name = s.Item_Name || 'Unknown';
    const qty = parseFloat(String(s.Qty || s.Quantity || 1));
    const rev = parseFloat(String(s.Total_Amount || s.Total_Price || 0));
    if (!itemSalesMap[name]) itemSalesMap[name] = { qty: 0, revenue: 0 };
    itemSalesMap[name].qty += qty;
    itemSalesMap[name].revenue += rev;
  });

  const topSellingItems = Object.entries(itemSalesMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  // Top Sales Staff
  const staffSalesMap: { [key: string]: { count: number; revenue: number } } = {};
  sales.forEach((s) => {
    const email = (s.Recorded_By || 'Unknown').toLowerCase();
    const rev = parseFloat(String(s.Total_Amount || s.Total_Price || 0));
    if (!staffSalesMap[email]) staffSalesMap[email] = { count: 0, revenue: 0 };
    staffSalesMap[email].count += 1;
    staffSalesMap[email].revenue += rev;
  });

  const topStaff = Object.entries(staffSalesMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3);

  // Expense by Category
  const expenseCategories: { [key: string]: number } = {};
  expenses.forEach((e) => {
    const cat = e.Category || e.Expense_Type || 'Others';
    expenseCategories[cat] = (expenseCategories[cat] || 0) + parseFloat(String(e.Amount || 0));
  });

  const topExpenseCategories = Object.entries(expenseCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Payment Method Breakdown
  const paymentMap: { [key: string]: number } = {};
  sales.forEach((s) => {
    const method = s.Payment_Method || 'Cash';
    paymentMap[method] = (paymentMap[method] || 0) + parseFloat(String(s.Total_Amount || s.Total_Price || 0));
  });

  // Recent Sales (last 5)
  const recentSales = [...sales]
    .sort((a, b) => {
      const dateA = new Date(a.Date || '').getTime();
      const dateB = new Date(b.Date || '').getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  // Sales Chart Data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales
      .filter((s) => String(s.Date || '').includes(dateStr))
      .reduce((a, c) => a + parseFloat(String(c.Total_Amount || c.Total_Price || 0)), 0);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      amount: daySales,
    };
  });

  const maxChartValue = Math.max(...last7Days.map((d) => d.amount), 1);

  return (
    <div className="space-y-6 font-sans text-slate-900">

      {/* ============================================================ */}
      {/* 🎯 WELCOME HEADER & TIME RANGE SELECTOR */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">ዳሽቦርድ (Dashboard)</h1>
                <p className="text-xs text-orange-100 font-bold mt-0.5">
                  📅 {new Date().toLocaleDateString('am-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-white/15 backdrop-blur-sm p-1.5 rounded-2xl border border-white/20">
            {[
              { key: 'today', label: 'ዛሬ' },
              { key: 'week', label: '7 ቀናት' },
              { key: 'month', label: '30 ቀናት' },
              { key: 'all', label: 'ሁሉም' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  timeRange === t.key
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📊 MAIN KPI CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* My Today Sales */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase">የእኔ</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">የእኔ የዛሬ ሽያጭ</span>
          <div className="text-2xl font-black text-orange-600 mt-1">
            {myTodaySalesVal.toLocaleString()} <span className="text-xs font-bold">ብር</span>
          </div>
        </div>

        {/* Today Total Sales */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">የዛሬ ጠቅላላ ሽያጭ</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {todaySalesTotal.toLocaleString()} <span className="text-xs font-bold">ብር</span>
          </div>
        </div>

        {/* Items Sold */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">የተሸጡ እቃዎች ብዛት</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {totalItemsSoldVal.toLocaleString()} <span className="text-xs font-bold">Pcs</span>
          </div>
        </div>

        {/* Today Profit */}
        {isOwnerOrManager ? (
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-700 p-5 rounded-3xl shadow-md text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              {todayProfitTotal >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-300" />
              )}
            </div>
            <span className="text-[11px] font-bold text-purple-200 uppercase block relative z-10">የዛሬ የተጣራ ትርፍ</span>
            <div className="text-2xl font-black mt-1 relative z-10">
              {todayProfitTotal.toLocaleString()} <span className="text-xs font-bold">ብር</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 border border-dashed p-5 rounded-3xl flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-2">
            <Eye className="w-6 h-6" />
            <span>ትርፍ ለአድሚን ብቻ</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 📈 SALES CHART - LAST 7 DAYS */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> የ7 ቀናት የሽያጭ እንቅስቃሴ
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-lg">
            ከፍተኛ: {maxChartValue.toLocaleString()} ብር
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 h-48 px-2">
          {last7Days.map((day, idx) => {
            const heightPercent = (day.amount / maxChartValue) * 100;
            const isToday = idx === last7Days.length - 1;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div
                    className={`w-full max-w-[60px] rounded-t-xl transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-lg'
                        : 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 3)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                      {day.amount.toLocaleString()} ብር
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black ${isToday ? 'text-orange-600' : 'text-slate-500'}`}>
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🏆 TOP SELLING & TOP STAFF - 2 COLUMN */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Items */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> ተመራጭ ምርቶች (Top Selling)
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">TOP 5</span>
          </div>

          {topSellingItems.length === 0 ? (
            <p className="text-center text-xs text-slate-400 italic py-6">ምንም የሽያጭ መረጃ አልተገኘም</p>
          ) : (
            <div className="space-y-3">
              {topSellingItems.map(([name, data], idx) => {
                const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][idx];
                const percent = (data.revenue / topSellingItems[0][1].revenue) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base">{medal}</span>
                        <span className="font-black text-slate-800 truncate">{name}</span>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">({data.qty} ብዛት)</span>
                      </div>
                      <span className="font-black text-emerald-600 shrink-0 ml-2">
                        {data.revenue.toLocaleString()} ብር
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Sales Staff */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> ከፍተኛ ሰራተኞች (Top Staff)
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">TOP 3</span>
          </div>

          {topStaff.length === 0 ? (
            <p className="text-center text-xs text-slate-400 italic py-6">ምንም የሰራተኛ እንቅስቃሴ አልተገኘም</p>
          ) : (
            <div className="space-y-3">
              {topStaff.map(([email, data], idx) => {
                const medal = ['🥇', '🥈', '🥉'][idx];
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          {medal} {email.split('@')[0]}
                        </p>
                        <span className="text-[10px] text-slate-500 font-bold">{data.count} ሽያጮች</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600 text-sm">{data.revenue.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400 font-bold">ብር</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 💰 FINANCIAL OVERVIEW & EXPENSE BREAKDOWN */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Summary */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-5">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" /> የፋይናንስ ማጠቃለያ
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-lg">
              {timeRange === 'today' ? 'ዛሬ' : timeRange === 'week' ? '7 ቀናት' : timeRange === 'month' ? '30 ቀናት' : 'ሁሉም'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase">ጠቅላላ ገቢ</span>
              </div>
              <p className="text-xl font-black text-emerald-600">{rangeSalesTotal.toLocaleString()}</p>
              <span className="text-[10px] font-bold text-emerald-700">ብር</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span className="text-[10px] font-black text-rose-700 uppercase">ጠቅላላ ወጪ</span>
              </div>
              <p className="text-xl font-black text-rose-600">{rangeExpensesTotal.toLocaleString()}</p>
              <span className="text-[10px] font-bold text-rose-700">ብር</span>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase">የተጣራ ትርፍ</span>
              </div>
              <p className={`text-xl font-black ${rangeProfitTotal >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {rangeProfitTotal.toLocaleString()}
              </p>
              <span className="text-[10px] font-bold text-indigo-700">ብር</span>
            </div>
          </div>

          {/* Profit Margin Visual */}
          <div className="mt-5 p-4 bg-slate-50 rounded-2xl border">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700">የትርፍ መጠን (Profit Margin)</span>
              <span className={parseFloat(profitMargin) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {profitMargin}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  parseFloat(profitMargin) >= 20
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : parseFloat(profitMargin) >= 0
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-rose-400 to-rose-600'
                }`}
                style={{ width: `${Math.min(Math.max(parseFloat(profitMargin), 0), 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-2">
              {parseFloat(profitMargin) >= 20
                ? '🎉 ጥሩ የትርፍ መጠን!'
                : parseFloat(profitMargin) >= 0
                ? '⚠️ መሻሻል ያስፈልጋል'
                : '🔴 ኪሳራ ላይ ነዎት!'}
            </p>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" /> የወጪ ስርጭት
            </h3>
          </div>

          {topExpenseCategories.length === 0 ? (
            <p className="text-center text-xs text-slate-400 italic py-6">ምንም ወጪ አልተመዘገበም</p>
          ) : (
            <div className="space-y-3">
              {topExpenseCategories.map(([cat, amount], idx) => {
                const percent = (amount / totalExpensesAll) * 100;
                const colors = [
                  'from-rose-400 to-rose-600',
                  'from-orange-400 to-orange-600',
                  'from-amber-400 to-amber-600',
                  'from-pink-400 to-pink-600',
                  'from-red-400 to-red-600',
                ];
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 truncate">{cat}</span>
                      <span className="text-rose-600 shrink-0 ml-2">
                        {amount.toLocaleString()} ብር
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-700`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{percent.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📋 RECENT SALES & STAFF ACTIVITY */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> የቅርብ ጊዜ ሽያጮች
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">LAST 5</span>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-center text-xs text-slate-400 italic py-6">ምንም የሽያጭ መዝገብ አልተገኘም</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 text-xs truncate">
                        {s.Item_Name || s.Customer_Name || 'Walk-in Sale'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {s.Date || 'N/A'} • {s.Recorded_By?.split('@')[0] || 'System'}
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600 text-sm shrink-0 ml-3">
                    {parseFloat(String(s.Total_Amount || s.Total_Price || 0)).toLocaleString()} ብር
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" /> የክፍያ ዘዴዎች
            </h3>
          </div>

          {Object.keys(paymentMap).length === 0 ? (
            <p className="text-center text-xs text-slate-400 italic py-6">ምንም የክፍያ መረጃ የለም</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(paymentMap)
                .sort((a, b) => b[1] - a[1])
                .map(([method, amount], idx) => {
                  const percent = (amount / totalSalesAll) * 100;
                  const icons = ['💵', '🏦', '📱', '💳'];
                  const colors = [
                    'from-emerald-400 to-emerald-600',
                    'from-blue-400 to-blue-600',
                    'from-purple-400 to-purple-600',
                    'from-indigo-400 to-indigo-600',
                  ];
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icons[idx % icons.length]}</span>
                          <span className="font-black text-slate-800 text-xs">{method}</span>
                        </div>
                        <span className="font-black text-slate-900 text-xs">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-700`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mt-1.5">
                        {amount.toLocaleString()} ብር
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 👥 STAFF PERFORMANCE OVERVIEW */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4 mb-5">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> የሰራተኞች አፈጻጸም ማጠቃለያ
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            ጠቅላላ: {users.length} ሰራተኞች
          </span>
        </div>

        {users.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-6">ምንም ሰራተኛ አልተመዘገበም</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {users.map((u, idx) => {
              const uEmail = (u.User_Email || u.Email || 'Employee').toLowerCase();
              const uSales = sales.filter(
                (s) => (s.Recorded_By || '').toLowerCase() === uEmail
              );
              const uRevenue = uSales.reduce(
                (a, c) => a + parseFloat(String(c.Total_Amount || c.Total_Price || 0)),
                0
              );
              
              return (
                <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border rounded-2xl hover:shadow-md transition group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-110 transition">
                      {uEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 text-xs truncate">
                        {uEmail.split('@')[0]}
                      </p>
                      <span className="text-[10px] font-bold text-indigo-600">{u.Role || 'Employee'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">ሽያጮች</span>
                      <p className="font-black text-slate-800 text-sm">{uSales.length}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">ገቢ</span>
                      <p className="font-black text-emerald-600 text-xs">
                        {uRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
