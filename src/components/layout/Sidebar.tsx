'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  PiggyBank,
  Users,
  FileBarChart,
  CalendarRange,
  Building2,
  Shield,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn, currentMonthYear, formatCurrency } from '@/lib/utils';
import type { UserRole } from '@/types';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { label: string; items: NavItem[] };

const sectionsByRole: Record<UserRole, NavSection[]> = {
  SUPER_ADMIN: [
    {
      label: 'Operations',
      items: [{ href: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'System',
      items: [{ href: '/admins', label: 'Admins', icon: Shield }],
    },
  ],
  ADMIN: [
    {
      label: 'Operations',
      items: [
        { href: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { href: '/meals', label: 'Member Daily Meals', icon: UtensilsCrossed },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/expenses', label: 'Expense Vouchers', icon: Receipt },
        { href: '/deposits', label: 'Deposit Ledger', icon: PiggyBank },
        { href: '/reports', label: 'Audit Reports', icon: FileBarChart },
        { href: '/monthly-report', label: 'Monthly Report', icon: CalendarRange },
      ],
    },
    {
      label: 'System',
      items: [
        { href: '/members', label: 'Member Directory', icon: Users },
        { href: '/mess', label: 'Meal Rules & Cutoffs', icon: Building2 },
        { href: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  MEMBER: [
    {
      label: 'Operations',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/meals', label: 'Member Daily Meals', icon: UtensilsCrossed },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/expenses', label: 'Expense Vouchers', icon: Receipt },
        { href: '/reports', label: 'Audit Reports', icon: FileBarChart },
      ],
    },
    {
      label: 'System',
      items: [{ href: '/settings', label: 'Settings', icon: Settings }],
    },
  ],
};

type SidebarSnap = {
  messName: string;
  mealRate: number;
  daysUntilClose: number;
  isLocked: boolean;
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

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
  const sections = user ? sectionsByRole[user.role] : [];
  const [snap, setSnap] = useState<SidebarSnap | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    const { month, year } = currentMonthYear();
    api
      .get('/dashboard', { params: { month, year } })
      .then((res) => {
        const data = res.data.data;
        if (cancelled || data?.needsMessSetup) return;
        setSnap({
          messName: data.messName || 'Mess',
          mealRate: Number(data.mealRate) || 0,
          daysUntilClose: Number(data.daysUntilClose) || 0,
          isLocked: Boolean(data.isLocked),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const daysInMonth = new Date(currentMonthYear().year, currentMonthYear().month, 0).getDate();
  const closeProgress = snap
    ? Math.min(100, Math.max(8, ((daysInMonth - snap.daysUntilClose) / daysInMonth) * 100))
    : 0;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-[100vh] max-h-[100vh] w-[260px] max-w-[85vw] flex-col overflow-hidden border-r border-[#1e293b] bg-[#0b1326] text-[#f8fafc] transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="shrink-0 px-4 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f46e5] text-xs font-bold tracking-wide">
              MM
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">MessMate</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">Dining ledger</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
              <p className="truncate text-sm font-medium">{snap?.messName || user?.name || 'Mess'}</p>
            </div>
            <p className="mt-1 pl-4 text-[11px] text-[#64748b]">
              {snap?.isLocked ? 'Month locked' : 'Active term'}
            </p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 pb-3">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition',
                        active
                          ? 'bg-[#4f46e5] text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]'
                          : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {user?.role === 'ADMIN' && snap && (
            <div className="rounded-xl border border-[#1e293b] bg-[#131b2e] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">Dynamic rate</p>
                <p className="text-sm font-semibold text-[#10b981]">{formatCurrency(snap.mealRate)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1e293b]">
                <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${closeProgress}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-[#94a3b8]">
                {snap.isLocked ? 'Month is locked' : `Closes in ${snap.daysUntilClose} days`}
              </p>
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-[#1e293b] p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e293b] text-xs font-semibold">
              {initials(user?.name || 'A')}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b1326] bg-[#10b981]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-[11px] text-[#64748b]">
                {user?.role === 'ADMIN' ? 'Mess Admin' : user?.role.replace('_', ' ')}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-white/5 hover:text-white"
              aria-label={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
