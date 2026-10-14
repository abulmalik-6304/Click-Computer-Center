'use client';

import { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Search, Mail, Phone, Lock, Eye, EyeOff, 
  CheckCircle2, UserPlus, Crown, Briefcase, User as UserIcon, UserCheck, ShieldAlert 
} from 'lucide-react';
import { UserAccount } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUserEmail: string;
  currentUserRole: string;
}

export default function UserFormModal({
  isOpen,
  onClose,
  users,
  currentUserEmail,
  currentUserRole,
}: UserFormModalProps) {
  const [userList, setUserList] = useState<UserAccount[]>(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile View Modal State
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Show Add User Form State (Controlled by "+ አዲስ ሰራተኛ ጨምር" Button)
  const [showAddForm, setShowAddForm] = useState(false);

  // Form States
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [role, setRole] = useState<'Owner' | 'Admin' | 'Manager' | 'Employee'>('Employee');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [profilePic, setProfilePic] = useState('');

  useEffect(() => {
    setUserList(users);
  }, [users]);

  if (!isOpen) return null;

  // STRICT ACCESS CONTROL: ONLY ADMIN / OWNER CAN ACCESS
  const isAdminOrOwner = currentUserRole === 'Owner' || currentUserRole === 'Admin';

  if (!isAdminOrOwner) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">ፍቃድ የለዎትም (Access Denied)</h3>
          <p className="text-xs text-slate-500 font-semibold">
            ይህ የዩዘር መዝገብ ክፍል ለአድሚን (Admin/Owner) ብቻ የተፈቀደ በመሆኑ ማየት አይችሉም።
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-2xl font-bold text-xs"
          >
            ወደኋላ ተመለስ
          </button>
        </div>
      </div>
    );
  }

  // Filtered Users
  const filteredUsers = userList.filter((u) => {
    const email = u.User_Email || (u as any).Email || '';
    const name = (u as any).User_Name || (u as any).Name || '';
    return email.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail.trim()) {
      alert('እባክዎን የዩዘር ኢሜይል ያስገቡ!');
      return;
    }

    const newUser: UserAccount = {
      User_Email: userEmail,
      Role: role,
      User_Name: userName || userEmail.split('@')[0],
      Phone_No: phoneNo,
      Status: status,
      Profile_Picture: profilePic,
      Recorded_By: currentUserEmail, // Hidden Email Registration
    } as any;

    setUserList([newUser, ...userList]);

    alert(`ተጠቃሚ "${userEmail}" በስኬት ተመዝግቧል!`);

    // Reset Form & Close Add Form Card
    setUserName('');
    setUserEmail('');
    setPassword('');
    setPhoneNo('');
    setRole('Employee');
    setStatus('Active');
    setProfilePic('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full my-6 relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-orange-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 text-white rounded-2xl shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-wide">የዩዘር መዝገብ (Admin Dashboard)</h3>
              <p className="text-xs text-orange-300 font-bold">የሰራተኞች የሲስተም አካውንቶች እና መቆጣጠሪያ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 space-y-6">
          
          {/* TOP BAR: SEARCH & "+ አዲስ ሰራተኛ ጨምር" BUTTON */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b pb-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="በኢሜይል ወይም በስም ይፈልጉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <UserPlus className="w-4 h-4" /> + አዲስ ሰራተኛ ጨምር
            </button>
          </div>

          {/* USER CARDS LIST GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs font-bold text-slate-400">ምንም የተመዘገበ ተጠቃሚ አልተገኘም።</p>
              </div>
            ) : (
              filteredUsers.map((u, idx) => {
                const uEmail = u.User_Email || (u as any).Email || 'N/A';
                const uName = (u as any).User_Name || uEmail.split('@')[0];
                const uRole = u.Role || 'Employee';
                const uPhone = (u as any).Phone_No || 'ስልክ የለውም';
                const uStatus = (u as any).Status || 'Active';
                const uPic = (u as any).Profile_Picture;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedUser(u)}
                    className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-orange-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-black text-slate-700 text-base">
                        {uPic ? (
                          <img src={uPic} alt={uName} className="w-full h-full object-cover" />
                        ) : (
                          uName.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{uName}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{uEmail}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                          uRole === 'Owner' || uRole === 'Admin'
                            ? 'bg-rose-100 text-rose-800'
                            : uRole === 'Manager'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {uRole === 'Owner' || uRole === 'Admin' ? <Crown className="w-3 h-3 text-rose-600" /> : null}
                        {uRole === 'Manager' ? <Briefcase className="w-3 h-3 text-amber-600" /> : null}
                        {uRole === 'Employee' ? <UserIcon className="w-3 h-3 text-blue-600" /> : null}
                        {uRole}
                      </span>

                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${uStatus === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {uStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* 🔴 CONDITIONAL MODAL 1: USER PROFILE DETAILS VIEW */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-60 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 relative space-y-6">
            <button onClick={() => setSelectedUser(null)} className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl mx-auto flex items-center justify-center font-black text-2xl border-2 border-orange-300 overflow-hidden">
                {(selectedUser as any).Profile_Picture ? (
                  <img src={(selectedUser as any).Profile_Picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  ((selectedUser as any).User_Name || selectedUser.User_Email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{(selectedUser as any).User_Name || selectedUser.User_Email.split('@')[0]}</h3>
                <p className="text-xs text-orange-600 font-extrabold">{selectedUser.Role} Account</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs font-semibold text-slate-700">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400">System Email:</span>
                <span className="font-bold text-slate-900">{selectedUser.User_Email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-bold text-slate-900">{(selectedUser as any).Phone_No || 'ስልክ የለውም'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600">{(selectedUser as any).Status || 'Active'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recorded By:</span>
                <span className="font-bold text-slate-800">{(selectedUser as any).Recorded_By || 'System Admin'}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs"
            >
              ዝጋ (Close Profile)
            </button>
          </div>
        </div>
      )}

      {/* 🔴 CONDITIONAL MODAL 2: ADD NEW USER REGISTRATION FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-60 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddForm(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b pb-3">
              <UserPlus className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-900">አዲስ ሰራተኛ / ተጠቃሚ መመዝገቢያ</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  User_Name (የሰራተኛው ስም)
                </label>
                <input
                  type="text"
                  placeholder="የሰራተኛውን ሙሉ ስም ይጻፉ..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  User_Email (የሲስተም መግቢያ ኢሜይል) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@gmail.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Password (ፓስወርድ)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Phone No (ስልክ ቁጥር)
                </label>
                <input
                  type="tel"
                  placeholder="0911......"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Role (የስልጣን ደረጃ)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Employee">👤 Employee (ሰራተኛ)</option>
                  <option value="Manager">👔 Manager (ማኔጀር)</option>
                  <option value="Admin">👑 Admin / Owner (አድሚን)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Status (ሁኔታ)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="Active">Active (አክቲቭ)</option>
                  <option value="Inactive">Inactive (የተዘጋ)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Profile Picture (የፎቶ ሊንክ)
                </label>
                <input
                  type="text"
                  placeholder="https://... የፎቶ ሊንክ"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-200">
                <span className="text-[10px] text-slate-400">
                  Recorded By: <strong className="text-slate-700">{currentUserEmail}</strong> (Hidden)
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                    ሰርዝ
                  </button>
                  <button type="submit" className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md">
                    መዝግብ (Save User)
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
