'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { AdminCommandCenter, type AdminDashboardData } from '@/components/dashboard/AdminCommandCenter';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleLock = async () => {
    if (!data) return;
    setLocking(true);
    try {
      await api.patch('/month-settings', {
        month: data.month,
        year: data.year,
        isLocked: !data.isLocked,
      });
      toast.success(data.isLocked ? 'Month unlocked' : 'Month locked');
      setConfirmLock(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLocking(false);
    }
  };

  return (
    <AppShell title="Dashboard">
      {loading || !data ? (
        <LoadingState />
      ) : data.needsMessSetup ? (
        <Card title="Set up your mess">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Create a mess to start adding members, meals, and expenses.
          </p>
          <Link href="/mess" className="mt-4 inline-block">
            <Button>Create Mess</Button>
          </Link>
        </Card>
      ) : user?.role === 'SUPER_ADMIN' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Admins" value={(data.stats as { adminCount: number }).adminCount} tone="accent" />
          <StatCard label="Messes" value={(data.stats as { messCount: number }).messCount} />
          <StatCard label="Members" value={(data.stats as { memberCount: number }).memberCount} />
        </div>
      ) : user?.role === 'MEMBER' ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Meals this month" value={String(data.mealsThisMonth)} tone="accent" />
            <StatCard label="Meal rate" value={formatCurrency(Number(data.mealRate))} />
            <StatCard label="Cost so far" value={formatCurrency(Number(data.costSoFar))} />
            <StatCard
              label="Balance"
              value={formatCurrency(Number(data.balance))}
              tone={Number(data.balance) >= 0 ? 'good' : 'bad'}
              hint={Number(data.balance) >= 0 ? 'Refund' : 'Due'}
            />
          </div>
          <Card title="Quick action">
            <p className="mb-3 text-sm text-slate-500">Add or update today&apos;s meal entry.</p>
            <Link href="/meals">
              <Button>Add today&apos;s meal</Button>
            </Link>
          </Card>
        </div>
      ) : (
        <>
          <AdminCommandCenter
            data={data as unknown as AdminDashboardData}
            locking={locking}
            onToggleLock={() => setConfirmLock(true)}
          />
          <ConfirmDialog
            open={confirmLock}
            onClose={() => setConfirmLock(false)}
            onConfirm={toggleLock}
            loading={locking}
            confirmLabel={data.isLocked ? 'Unlock' : 'Lock month'}
            title={data.isLocked ? 'Unlock month' : 'Lock month'}
            message={
              data.isLocked
                ? 'Unlocking lets admins and members edit meals, expenses, and deposits again.'
                : 'Locking freezes meals, expenses, and deposits for this month.'
            }
          />
        </>
      )}
    </AppShell>
  );
}
