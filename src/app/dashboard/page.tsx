'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/EmptyState';
import { ExpenseChart } from '@/components/reports/ExpenseChart';
import { api, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    load();
  }, []);

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
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total expense" value={formatCurrency(Number(data.totalExpense))} tone="accent" />
            <StatCard label="Total meals" value={String(data.totalMeals)} />
            <StatCard label="Meal rate" value={formatCurrency(Number(data.mealRate))} />
            <StatCard label="Members" value={String(data.memberCount)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card title="Expense by category">
              <ExpenseChart data={(data.expenseChart as { category: string; amount: number }[]) || []} />
            </Card>
            <Card title="Member balances">
              <div className="space-y-2">
                {((data.memberBalances as { name: string; balance: number; totalMeals: number }[]) || []).map(
                  (m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.totalMeals} meals</p>
                      </div>
                      <span className={m.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatCurrency(m.balance)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>

          <Card title="Recent activity">
            <div className="space-y-2">
              {((data.recentActivity as { id: string; action: string; entity: string; createdAt: string; user?: { name?: string } }[]) || []).map(
                (a) => (
                  <div key={a.id} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 py-2 last:border-0">
                    <span>
                      <span className="font-medium">{a.user?.name || 'User'}</span> {a.action.toLowerCase()} {a.entity}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
