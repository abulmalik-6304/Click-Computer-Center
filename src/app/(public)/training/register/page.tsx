'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/training/register', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(fd)),
      headers: { 'Content-Type': 'application/json' },
    });
    setStatus(res.ok ? 'ok' : 'error');
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Student Registration</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <input type="hidden" name="course" defaultValue={params.get('course') ?? ''} />
        {[
          ['fullName', 'Full Name'], ['email', 'Email'], ['phone', 'Phone'],
        ].map(([n, l]) => (
          <div key={n}>
            <label className="block text-sm font-semibold text-slate-900 mb-1">{l}</label>
            <input required name={n} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Course</label>
          <select name="courseSelect" defaultValue={params.get('course') ?? ''} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900">
            <option value="web-dev">Full-Stack Web Development</option>
            <option value="ccna">Networking (CCNA Prep)</option>
            <option value="office">MS Office & Digital Literacy</option>
            <option value="graphic">Graphic Design Essentials</option>
          </select>
        </div>
        <button disabled={status === 'loading'} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-50">
          {status === 'loading' ? 'Submitting…' : 'Submit Registration'}
        </button>
        {status === 'ok' && <p className="text-emerald-700 font-medium">✅ Registration received. We'll contact you shortly.</p>}
        {status === 'error' && <p className="text-red-600 font-medium">Something went wrong. Please retry.</p>}
      </form>
    </div>
  );
}
