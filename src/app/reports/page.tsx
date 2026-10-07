'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Lock, Unlock, Printer } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/EmptyState';
import { ExpenseChart } from '@/components/reports/ExpenseChart';
import { api, getErrorMessage } from '@/lib/api';
import { currentMonthYear, formatCurrency, formatDate, monthLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState('');
  const [memberReport, setMemberReport] = useState<Record<string, unknown> | null>(null);
  const [adminReport, setAdminReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [adminRes, memberRes] = await Promise.all([
          api.get('/reports/admin', { params: { month, year } }),
          api.get('/reports/member', {
            params: { month, year, ...(userId ? { userId } : {}) },
          }),
        ]);
        setAdminReport(adminRes.data.data);
        setMemberReport(memberRes.data.data);
      } else {
        const res = await api.get('/reports/member', { params: { month, year } });
        setMemberReport(res.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, year, userId, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users', { params: { role: 'MEMBER', limit: 100 } }).then((res) => {
      setMembers(res.data.data);
      if (!userId && res.data.data[0]) setUserId(res.data.data[0].id);
    });
  }, [isAdmin, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLock = async () => {
    if (!adminReport) return;
    setLocking(true);
    try {
      await api.patch('/month-settings', {
        month,
        year,
        isLocked: !adminReport.isLocked,
      });
      toast.success(adminReport.isLocked ? 'Month unlocked' : 'Month locked');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLocking(false);
    }
  };

  const exportCsv = async (type: 'member' | 'admin') => {
    try {
      const res = await api.get(`/reports/${type}/export/csv`, {
        params: { month, year, ...(type === 'member' && userId ? { userId } : {}) },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${year}-${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const summary = memberReport?.summary as {
    totalMeals: number;
    mealRate: number;
    totalCost: number;
    totalDeposit: number;
    balance: number;
    status: string;
  } | undefined;

  return (
    <AppShell title="Reports" roles={['ADMIN', 'MEMBER']}>
      <div className="mb-4 flex flex-wrap items-end gap-2 no-print">
        <Select
          label="Month"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          options={Array.from({ length: 12 }, (_, i) => ({
            value: i + 1,
            label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
          }))}
        />
        <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" />
        {isAdmin && (
          <Select
            label="Member"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
        )}
        <Button variant="outline" onClick={() => exportCsv('member')}>
          <Download size={16} /> CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} /> Print / PDF
        </Button>
        {isAdmin && (
          <>
            <Button variant="outline" onClick={() => exportCsv('admin')}>
              <Download size={16} /> Admin CSV
            </Button>
            <Button variant="secondary" loading={locking} onClick={toggleLock}>
              {adminReport?.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
              {adminReport?.isLocked ? 'Unlock month' : 'Lock month'}
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total meals" value={summary?.totalMeals ?? 0} tone="accent" />
            <StatCard label="Meal rate" value={formatCurrency(summary?.mealRate ?? 0)} />
            <StatCard label="Total cost" value={formatCurrency(summary?.totalCost ?? 0)} />
            <StatCard label="Deposit" value={formatCurrency(summary?.totalDeposit ?? 0)} />
            <StatCard
              label="Balance"
              value={formatCurrency(summary?.balance ?? 0)}
              tone={(summary?.balance ?? 0) >= 0 ? 'good' : 'bad'}
              hint={summary?.status}
            />
          </div>

          <Card title={`${(memberReport?.member as { name?: string })?.name || 'Member'} — ${monthLabel(month, year)}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Date</th>
                    <th className="py-2">B</th>
                    <th className="py-2">L</th>
                    <th className="py-2">D</th>
                    <th className="py-2">Guest</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {((memberReport?.days as { date: string; breakfast: number; lunch: number; dinner: number; guestMeals: number; dailyTotal: number }[]) || []).map(
                    (d) => (
                      <tr key={d.date} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2">{formatDate(d.date)}</td>
                        <td className="py-2">{d.breakfast}</td>
                        <td className="py-2">{d.lunch}</td>
                        <td className="py-2">{d.dinner}</td>
                        <td className="py-2">{d.guestMeals}</td>
                        <td className="py-2 font-medium">{d.dailyTotal}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {isAdmin && adminReport && (
            <>
              <Card title="All members summary">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-2">Name</th>
                        <th className="py-2">Meals</th>
                        <th className="py-2">Cost</th>
                        <th className="py-2">Deposit</th>
                        <th className="py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((adminReport.members as { userId: string; name: string; totalMeals: number; totalCost: number; totalDeposit: number; balance: number }[]) || []).map(
                        (m) => (
                          <tr key={m.userId} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 font-medium">{m.name}</td>
                            <td className="py-2">{m.totalMeals}</td>
                            <td className="py-2">{formatCurrency(m.totalCost)}</td>
                            <td className="py-2">{formatCurrency(m.totalDeposit)}</td>
                            <td className={`py-2 ${m.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(m.balance)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card title="Expense by category">
                <ExpenseChart
                  data={(adminReport.expenseChart as { category: string; amount: number }[]) || []}
                />
              </Card>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
