'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, Camera, Check, LogOut, Settings } from 'lucide-react';

// 1. የ Google Drive ምስል ማስተካከያ Helper Function
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

// 2. Sign In Card Component
export function SignInCard({ onLogin }: { onLogin: (email: string, role: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // የአንተ ኢሜል ከሆነ የ Owner ስልጣን ይሰጠዋል
    const role = email.toLowerCase().includes('abdulmelik') || email.toLowerCase().includes('owner') ? 'Owner' : 'Employee';
    onLogin(email, role);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg font-black text-2xl">
            C
          </div>
          <h2 className="text-2xl font-black text-slate-900">Click Computer Center</h2>
          <p className="text-xs text-slate-500 font-bold">ወደ ሲስተሙ ለመግባት ኢሜይል እና ፓስወርድ ያስገቡ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-1">ኢሜይል (Email)</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
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

          <button
            type="submit"
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs shadow-xl transition cursor-pointer"
          >
            ወደ ሲስተሙ ግባ (Sign In)
          </button>
        </form>
      </div>
    </div>
  );
}
