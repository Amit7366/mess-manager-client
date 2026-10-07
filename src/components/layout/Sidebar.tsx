'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Wallet,
  PiggyBank,
  Users,
  FileBarChart,
  Building2,
  Shield,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const navByRole: Record<UserRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  SUPER_ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admins', label: 'Admins', icon: Shield },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
    { href: '/expenses', label: 'Expenses', icon: Wallet },
    { href: '/deposits', label: 'Deposits', icon: PiggyBank },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/reports', label: 'Reports', icon: FileBarChart },
    { href: '/mess', label: 'Mess', icon: Building2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  MEMBER: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/meals', label: 'My Meals', icon: UtensilsCrossed },
    { href: '/expenses', label: 'Expenses', icon: Wallet },
    { href: '/reports', label: 'My Report', icon: FileBarChart },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
};

export function Sidebar({
  open,
  onClose,
  dark,
  toggleDark,
}: {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  toggleDark: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const items = user ? navByRole[user.role] : [];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform lg:translate-x-0 lg:static',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">Mess Manager</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {user?.name}
          </p>
          <p className="text-xs text-slate-500">{user?.role.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 p-3">
          <button
            onClick={toggleDark}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
