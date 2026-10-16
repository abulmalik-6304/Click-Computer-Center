import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊', roles: ['owner','manager','staff'] },
  { href: '/admin/inventory', label: 'Inventory', icon: '📦', roles: ['owner','manager','staff'] },
  { href: '/admin/sales', label: 'Sales / Data Center', icon: '🧾', roles: ['owner','manager','staff'] },
  { href: '/admin/staff', label: 'Staff & Badges', icon: '🏅', roles: ['owner','manager'] },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️', roles: ['owner'] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = (session.user as any).role as string;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-lg font-bold text-white">Click Computer</p>
          <p className="text-xs text-slate-400">Enterprise Console</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.filter(n => n.roles.includes(role)).map(n => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10 transition">
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs">
          <p className="text-white font-semibold">{session.user?.name}</p>
          <p className="text-slate-400 capitalize">{role}</p>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
