'use client';

import { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  ShieldAlert, 
  History, 
  Activity, 
  Search, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Lock, 
  Unlock,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface UserActivityTabProps {
  users: UserAccount[];
  currentUserEmail: string;
  currentUserRole: UserRole;
  auditLogs?: any[];
  onRefresh?: () => void;
}

export default function UserActivityTab({
  users = [],
  currentUserEmail,
  currentUserRole,
  auditLogs = [],
  onRefresh,
}: UserActivityTabProps) {
  const [subTab, setSubTab] = useState<'profiles' | 'active_sessions' | 'audit_logs'>('profiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [profilePic, setProfilePic] = useState<string>('');
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<string>('All');

  const isAdminOrOwner = currentUserRole === 'Owner' || currentUserRole === 'Admin';

  // Sample or actual user list with extended properties
  const filteredUsers = users.filter((u) => {
    const email = (u.User_Email || (u as any).Email || '').toLowerCase();
    const role = (u.Role || '').toLowerCase();
    return email.includes(searchTerm.toLowerCase()) || role.includes(searchTerm.toLowerCase());
  });

  // Mock Active Statuses & Hours Tracker
  const userStats = filteredUsers.map((u, idx) => {
    const email = u.User_Email || (u as any).Email || 'User';
    const isCurrentUser = email.toLowerCase() === currentUserEmail.toLowerCase();
    const isActiveNow = isCurrentUser || idx % 2 === 0; // Mock activity
    const isBlocked = (u as any).Status === 'Blocked' || (u as any).Is_Blocked === true;

    return {
      ...u,
      email,
      isActiveNow,
      isBlocked,
      loginTime: isActiveNow ? '08:30 AM' : '10:15 AM (Yesterday)',
      hoursLoggedToday: isActiveNow ? `${3 + (idx % 4)} ሰዓት ከ ${15 + idx * 5} ደቂቃ` : '0 ሰዓት',
      actionsCount: 12 + idx * 7,
    };
  });

  const handleToggleBlockUser = (email: string, currentStatus: boolean) => {
    if (!isAdminOrOwner) {
      alert('ይህንን ለማድረግ የአድሚን ፍቃድ ያስፈልጎታል!');
      return;
    }
    const action = currentStatus ? 'ከእገዳ ነጻ ማድረግ' : 'ማገድ';
    if (confirm(`እርግጠኛ ነዎት ${email} ተጠቃሚን ${action} ይፈልጋሉ?`)) {
      alert(`ተጠቃሚው ${email} በተሳካ ሁኔታ ${action} ተደርጓል!`);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" /> የተጠቃሚዎች ፕሮፋይል እና የአክቲቪቲ ቁጥጥር
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            የሰራተኞች የመስመር ላይ መገኘት (Online Status)፣ የስራ ሰዓት፣ ፕሮፋይል እና የሲስተም ድርጊቶች (Audit Log)
          </p>
        </div>

        {/* SUB-TAB BUTTONS */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border">
          <button
            onClick={() => setSubTab('profiles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'profiles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-500" /> ሰራተኞችና ፕሮፋይል
          </button>
          <button
            onClick={() => setSubTab('active_sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'active_sessions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-500" /> የስራ ሰዓትና አክቲቪቲ
          </button>
          {isAdminOrOwner && (
            <button
              onClick={() => setSubTab('audit_logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subTab === 'audit_logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-purple-500" /> Audit Log (የድርጊት መዝገብ)
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & PROFILE HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="በኢሜይል ወይም በሮል ፈልግ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              {currentUserEmail.slice(0, 2).toUpperCase()}
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full absolute bottom-0 right-0"></span>
          </div>
          <div>
            <p className="text-xs font-black text-indigo-900">{currentUserEmail}</p>
            <span className="text-[10px] text-indigo-600 font-bold">{currentUserRole} Account (Active Now)</span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 👤 1. PROFILES & USER CARDS */}
      {/* ================================================================= */}
      {subTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStats.map((u, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden transition hover:shadow-md ${
                u.isBlocked ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              {/* Active / Blocked Badge */}
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      u.isBlocked ? 'bg-rose-500' : u.isActiveNow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                    }`}
                  ></span>
                  <span className="text-xs font-bold text-slate-700">
                    {u.isBlocked ? 'የታገደ (Blocked)' : u.isActiveNow ? 'መስመር ላይ (Active)' : 'ከመስመር ውጭ (Offline)'}
                  </span>
                </div>

                <span className="px-3 py-1 bg-slate-100 text-slate-800 text-[11px] font-black rounded-xl">
                  {u.Role || 'Employee'}
                </span>
              </div>

              {/* User Identity */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg rounded-2xl flex items-center justify-center shadow-md relative">
                  {u.email.slice(0, 2).toUpperCase()}
                  {u.email.toLowerCase() === currentUserEmail.toLowerCase() && (
                    <button title="ፕሮፋይል ፎቶ ቀይር" className="absolute -bottom-1 -right-1 p-1 bg-white text-slate-700 rounded-full border shadow-sm hover:bg-slate-100">
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-sm">{u.email.split('@')[0]}</h4>
                  <p className="text-[11px] text-slate-500 font-bold">{u.email}</p>
                  <p className="text-[10px] text-indigo-600 font-black mt-0.5">የዛሬ ስራ ሰዓት፦ {u.hoursLoggedToday}</p>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdminOrOwner && u.email.toLowerCase() !== currentUserEmail.toLowerCase() && (
                <div className="pt-4 border-t flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">የአድሚን ቁጥጥር፦</span>
                  <button
                    onClick={() => handleToggleBlockUser(u.email, u.isBlocked)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                      u.isBlocked
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    }`}
                  >
                    {u.isBlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> እገዳ አንሳ
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> ሰራተኛውን እገድ
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* ⏱️ 2. ACTIVE SESSIONS & HOURS LOGGED */}
      {/* ================================================================= */}
      {subTab === 'active_sessions' && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b pb-3">
            <Clock className="w-5 h-5 text-emerald-600" /> የሰራተኞች የዛሬ የስራ ሰዓትና የመግቢያ ታሪክ
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3">ሰራተኛ (User Email)</th>
                  <th className="p-3">ሮል (Role)</th>
                  <th className="p-3">የመግቢያ ሰዓት (Login Time)</th>
                  <th className="p-3">የቆየበት ሰዓት (Logged Hours)</th>
                  <th className="p-3">የመዝገብ ብዛት</th>
                  <th className="p-3">ሁኔታ</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {userStats.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-indigo-600">{u.email}</td>
                    <td className="p-3 font-bold">{u.Role || 'Employee'}</td>
                    <td className="p-3">{u.loginTime}</td>
                    <td className="p-3 font-black text-emerald-600">{u.hoursLoggedToday}</td>
                    <td className="p-3 font-bold text-slate-700">{u.actionsCount} ምዝገባዎች</td>
                    <td className="p-3">
                      {u.isBlocked ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg">የታገደ</span>
                      ) : u.isActiveNow ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg">Active Now</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold rounded-lg">Offline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📜 3. AUDIT LOG (SYSTEM ACTION HISTORY) */}
      {/* ================================================================= */}
      {subTab === 'audit_logs' && isAdminOrOwner && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" /> የሲስተም አክቲቪቲ ኦዲት (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">ማን፣ መቼ፣ ምን እንደመዘገበ፣ እንዳሻሻለ ወይም እንደሰረዘ ሙሉ መረጃ</p>
            </div>

            {/* Filter by User */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">በተጠቃሚ መዝግብ፦</span>
              <select
                value={selectedUserForAudit}
                onChange={(e) => setSelectedUserForAudit(e.target.value)}
                className="bg-slate-50 border rounded-xl p-2 text-xs font-bold text-slate-800"
              >
                <option value="All">ሁሉም ሰራተኞች</option>
                {users.map((u, i) => (
                  <option key={i} value={u.User_Email}>{u.User_Email}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3">ቀንና ሰዓት</th>
                  <th className="p-3">የሰራተኛ ኢሜይል</th>
                  <th className="p-3">ድርጊት (Action)</th>
                  <th className="p-3">ክፍል (Module)</th>
                  <th className="p-3">ዝርዝር መግለጫ</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-800 font-medium">
                {/* Mock Audit Log Data */}
                {[
                  { time: '2026-10-13 04:15 PM', user: 'clickcomputercenter230@gmail.com', action: 'CREATE', module: 'Sales', details: 'አዲስ የሽያጭ መዝገብ አስገባ (INV-1004)' },
                  { time: '2026-10-13 02:30 PM', user: 'tofik.tahar@gmail.com', action: 'UPDATE', module: 'Inventory', details: 'የእቃ ዋጋ አሻሻለ (Laptop Charger)' },
                  { time: '2026-10-13 11:10 AM', user: 'clickcomputercenter230@gmail.com', action: 'DELETE', module: 'Expense', details: 'የተሳሳተ የወጪ መዝገብ ሰረዘ (EXP-12)' },
                  { time: '2026-10-12 05:45 PM', user: 'employee1@gmail.com', action: 'CREATE', module: 'Income', details: 'የስልጠና ክፍያ መዘገበ (5000 ብር)' },
                ]
                  .filter((log) => selectedUserForAudit === 'All' || log.user === selectedUserForAudit)
                  .map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-500">{log.time}</td>
                      <td className="p-3 font-bold text-indigo-600">{log.user}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{log.module}</td>
                      <td className="p-3 text-slate-700">{log.details}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
