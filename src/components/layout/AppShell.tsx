'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LoadingState } from '../ui/EmptyState';
import type { UserRole } from '@/types';

export function AppShell({
  children,
  title,
  roles,
}: {
  children: ReactNode;
  title?: string;
  roles?: UserRole[];
}) {
  const { loading } = useAuthGuard(roles);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <LoadingState label="Loading workspace..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b1326] text-[#f8fafc]">
      <Sidebar open={open} onClose={() => setOpen(false)} dark={dark} toggleDark={toggleDark} />
      <div className="app-main flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#1e293b] bg-[#0b1326]/95 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
          <button
            className="rounded-lg p-2 text-[#f8fafc] hover:bg-white/5 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        </header>
        <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
