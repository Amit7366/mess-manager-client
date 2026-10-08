'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, Lock, Printer, Search, Unlock } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ConfirmDialog } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { currentMonthYear, formatCurrency, monthLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

type MemberRow = {
  userId: string;
  name: string;
  email: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
  totalMeals: number;
  totalCost: number;
  totalDeposit: number;
  balance: number;
  status: 'refund' | 'due' | 'settled';
};

type AdminReport = {
  month: number;
  year: number;
  totalMeals: number;
  foodExpenses: number;
  totalExpenses: number;
  totalDeposits: number;
  mealRate: number;
  isLocked: boolean;
  members: MemberRow[];
};

type Filter = 'all' | 'due' | 'refund';

export default function MonthlyReportPage() {
  const { user } = useAuthStore();
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/admin', { params: { month, year } });
      setReport(res.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const members = report?.members || [];
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesFilter = filter === 'all' || member.status === filter;
      const matchesQuery =
        !q || member.name.toLowerCase().includes(q) || member.email.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [report, query, filter]);

  const totals = useMemo(() => {
    const members = report?.members || [];
    const due = members.filter((m) => m.balance < 0);
    const refund = members.filter((m) => m.balance > 0);
    return {
      members: members.length,
      dueAmount: due.reduce((sum, m) => sum + Math.abs(m.balance), 0),
      dueCount: due.length,
      refundAmount: refund.reduce((sum, m) => sum + m.balance, 0),
      refundCount: refund.length,
    };
  }, [report]);

  const exportCsv = async () => {
    try {
      const res = await api.get('/reports/admin/export/csv', {
        params: { month, year },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-report-${year}-${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleLock = async () => {
    if (!report) return;
    setLocking(true);
    try {
      await api.patch('/month-settings', { month, year, isLocked: !report.isLocked });
      toast.success(report.isLocked ? 'Month unlocked' : 'Month locked');
      setConfirmLock(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLocking(false);
    }
  };

  const rate = report?.mealRate ?? 0;

  return (
    <AppShell title="Monthly Report" roles={['ADMIN']}>
      <div className="text-[#f8fafc]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
              Settlement ledger
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Monthly reconciliation
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">{monthLabel(month, year)}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              aria-label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
            <input
              aria-label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm sm:w-24"
            />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm font-semibold"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center justify-center gap-2 rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm font-semibold"
            >
              <Printer size={15} /> Print
            </button>
            <button
              type="button"
              onClick={() => setConfirmLock(true)}
              className="no-print inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-3 py-2 text-sm font-semibold"
            >
              {report?.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
              {report?.isLocked ? 'Unlock month' : 'Freeze & close month'}
            </button>
          </div>
        </div>

        {loading || !report ? (
          <div className="mt-6">
            <LoadingState />
          </div>
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-[#1e293b] bg-[#131b2e] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Reconciliation formula
              </p>
              <div className="mt-3 flex flex-col gap-3 text-sm lg:flex-row lg:items-center">
                <Formula
                  label="Food expenses"
                  value={formatCurrency(report.foodExpenses)}
                />
                <span className="hidden text-[#64748b] lg:inline">÷</span>
                <Formula label="Total meals" value={report.totalMeals.toLocaleString()} />
                <span className="hidden text-[#64748b] lg:inline">=</span>
                <Formula label="Meal rate" value={`${formatCurrency(rate)} / meal`} accent />
              </div>
              <p className="mt-3 text-xs text-[#94a3b8]">
                Balance = member deposits − (meals × {formatCurrency(rate)}). A positive balance is a refund.
                A negative balance is due.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-[#1e293b] bg-[#131b2e] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search members"
                    className="w-full rounded-xl border border-[#1e293b] bg-[#0b1326] py-2 pl-9 pr-3 text-sm outline-none lg:w-64"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {(
                    [
                      ['all', 'All'],
                      ['due', 'Due only'],
                      ['refund', 'Refund only'],
                    ] as [Filter, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        filter === key ? 'bg-[#4f46e5] text-white' : 'bg-[#0b1326] text-[#94a3b8]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-[#64748b]">
                    <tr className="border-b border-[#1e293b]">
                      {['Member', 'Breakfast', 'Lunch', 'Dinner', 'Guest', 'Meals', 'Cost', 'Deposits', 'Balance'].map(
                        (heading) => (
                          <th
                            key={heading}
                            className={`sticky top-0 bg-[#131b2e] py-2 ${heading === 'Member' ? 'text-left' : 'text-right'}`}
                          >
                            {heading}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#64748b]">
                          No members match this filter.
                        </td>
                      </tr>
                    )}
                    {rows.map((member) => (
                      <tr key={member.userId} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="py-3">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-[11px] text-[#64748b]">{member.email}</p>
                        </td>
                        <td className="py-3 text-right tabular-nums">{member.breakfast}</td>
                        <td className="py-3 text-right tabular-nums">{member.lunch}</td>
                        <td className="py-3 text-right tabular-nums">{member.dinner}</td>
                        <td className="py-3 text-right tabular-nums">{member.guestMeals}</td>
                        <td className="py-3 text-right font-medium tabular-nums">{member.totalMeals}</td>
                        <td className="py-3 text-right tabular-nums">{formatCurrency(member.totalCost)}</td>
                        <td className="py-3 text-right tabular-nums">{formatCurrency(member.totalDeposit)}</td>
                        <td className="py-3 text-right">
                          <BalanceBadge balance={member.balance} status={member.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Summary label="Active members" value={String(totals.members)} />
              <Summary label="Deposits collected" value={formatCurrency(report.totalDeposits)} />
              <Summary
                label="Dues to collect"
                value={formatCurrency(totals.dueAmount)}
                hint={`${totals.dueCount} members`}
                tone="bad"
              />
              <Summary
                label="Refunds to disburse"
                value={formatCurrency(totals.refundAmount)}
                hint={`${totals.refundCount} members`}
                tone="good"
              />
            </section>
            <p className="mt-3 text-[11px] text-[#64748b]">
              {monthLabel(month, year)} · Prepared by {user?.name || 'Mess Admin'} · Meal rate{' '}
              {formatCurrency(rate)} · {report.isLocked ? 'Month locked' : 'Month open'}
            </p>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmLock}
        onClose={() => setConfirmLock(false)}
        onConfirm={toggleLock}
        loading={locking}
        confirmLabel={report?.isLocked ? 'Unlock' : 'Freeze month'}
        title={report?.isLocked ? 'Unlock month' : 'Freeze & close month'}
        message={
          report?.isLocked
            ? 'Unlocking lets meals, expenses, and deposits be edited again.'
            : 'Locking freezes meals, expenses, and deposits for this month.'
        }
      />
    </AppShell>
  );
}

function Formula({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0b1326] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${accent ? 'text-[#10b981]' : ''}`}>{value}</p>
    </div>
  );
}

function BalanceBadge({ balance, status }: { balance: number; status: MemberRow['status'] }) {
  const tone =
    status === 'refund'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'due'
        ? 'bg-rose-500/15 text-rose-300'
        : 'bg-white/5 text-[#94a3b8]';
  const label = status === 'refund' ? 'Refund' : status === 'due' ? 'Due' : 'Settled';
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {formatCurrency(balance)} {label}
    </span>
  );
}

function Summary({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="rounded-2xl border border-[#1e293b] bg-[#131b2e] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${
          tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-rose-300' : ''
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[#64748b]">{hint}</p>}
    </div>
  );
}
