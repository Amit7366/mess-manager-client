'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Lock, Plus, Unlock, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, monthLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700'] });

export interface AdminDashboardData {
  messName: string;
  month: number;
  year: number;
  isLocked: boolean;
  daysUntilClose: number;
  totalExpense: number;
  totalMeals: number;
  regularMeals: number;
  guestMeals: number;
  mealRate: number;
  totalDeposits: number;
  poolBalance: number;
  expenseChange: number;
  memberCount: number;
  activeEaters: number;
  mealsPerPerson: number;
  expenseCount: number;
  largestExpense: number;
  dueCount: number;
  expenseChart: { category: string; amount: number; share: number }[];
  memberBalances: {
    userId: string;
    name: string;
    email: string;
    totalMeals: number;
    totalCost: number;
    totalDeposit: number;
    balance: number;
  }[];
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    category: string;
    note?: string;
    date: string;
    createdBy?: { name?: string };
  }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    user?: { name?: string };
  }[];
}

const groups = [
  { key: 'bazaar', label: 'Bazaar & Rice', categories: ['Rice', 'Other'], color: '#818cf8' },
  { key: 'meat', label: 'Meat & Fish', categories: ['Fish/Meat'], color: '#f59e0b' },
  { key: 'veg', label: 'Veggies & Dairy', categories: ['Vegetable'], color: '#34d399' },
  { key: 'gas', label: 'Gas & Condiments', categories: ['Gas'], color: '#94a3b8' },
];

function sumCategories(chart: AdminDashboardData['expenseChart'], names: string[]) {
  return chart.filter((item) => names.includes(item.category)).reduce((sum, item) => sum + item.amount, 0);
}

function initials(name?: string) {
  if (!name) return '—';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function AdminCommandCenter({
  data,
  locking,
  onToggleLock,
}: {
  data: AdminDashboardData;
  locking: boolean;
  onToggleLock: () => void;
}) {
  const [filter, setFilter] = useState('All');
  const utilities = sumCategories(data.expenseChart, ['Utility']);
  const staff = sumCategories(data.expenseChart, ['Salary']);
  const groceries = sumCategories(data.expenseChart, ['Rice', 'Vegetable', 'Fish/Meat', 'Other']);
  const bars = groups
    .map((group) => ({
      ...group,
      amount: sumCategories(data.expenseChart, group.categories),
    }))
    .filter((group) => group.amount > 0);
  const barTotal = bars.reduce((sum, group) => sum + group.amount, 0) || 1;
  const filters = useMemo(
    () => ['All', ...Array.from(new Set(data.recentExpenses.map((item) => item.category)))],
    [data.recentExpenses]
  );
  const expenses = data.recentExpenses.filter((item) => filter === 'All' || item.category === filter).slice(0, 5);
  const solvent = data.poolBalance >= 0;

  const exportCsv = async () => {
    const res = await api.get('/reports/admin/export/csv', {
      params: { month: data.month, year: data.year },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${data.year}-${data.month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${jakarta.className} min-w-0 text-[#f8fafc]`}>
      <div className="mx-auto min-w-0 max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">Hostel residency ledger</p>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                Meal rate {formatCurrency(data.mealRate)}
              </span>
            </div>
            <h2 className="mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl lg:text-[28px]">
              Admin Command Center — {monthLabel(data.month, data.year)}
            </h2>
            <p className="mt-1 text-xs text-[#64748b]">{data.messName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Status: {data.isLocked ? 'Locked' : `Active (closes in ${data.daysUntilClose} days)`}
              </span>
              <button
                type="button"
                disabled={locking}
                onClick={onToggleLock}
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-300"
              >
                {data.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                {data.isLocked ? 'Unlock month' : 'Lock / Freeze month'}
              </button>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-1 xl:grid-cols-2">
            <Link href="/expenses" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d5efc] px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(109,94,252,0.35)]">
              <Plus size={16} /> Record expense
            </Link>
            <Link href="/deposits" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-2.5 text-sm font-semibold">
              <Wallet size={16} /> Log deposit
            </Link>
            <Link href="/members" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#12182b] px-4 py-2.5 text-sm font-semibold sm:col-span-2 xl:col-span-2">
              Manage members
            </Link>
          </div>
        </div>

        <section className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <Label>Total mess expenses</Label>
            <div className="mt-1 flex items-start justify-between gap-2">
              <Value>{formatCurrency(data.totalExpense)}</Value>
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${data.expenseChange > 0 ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                {data.expenseChange > 0 ? '+' : ''}
                {data.expenseChange}%
              </span>
            </div>
            <Rows
              rows={[
                ['Groceries & bazaar', groceries],
                ['Utilities & water', utilities],
                ['Gas & mess staff', staff + sumCategories(data.expenseChart, ['Gas'])],
              ]}
            />
          </Card>
          <Card>
            <Label>Total meals consumed</Label>
            <Value>{data.totalMeals.toLocaleString()} meals</Value>
            <Rows
              rows={[
                ['Regular boarder meals', data.regularMeals],
                ['Guest extra meals', data.guestMeals],
              ]}
              raw
            />
            <p className="mt-3 text-xs text-[#64748b]">
              Active eaters: {data.activeEaters} · {data.mealsPerPerson} meals/person
            </p>
          </Card>
          <Card>
            <Label>Live dynamic meal rate</Label>
            <Value className="text-emerald-300">{formatCurrency(data.mealRate)} / meal</Value>
            <p className="mt-3 text-xs text-[#94a3b8]">Food expenses ÷ total meals</p>
            <p className="mt-2 text-xs text-emerald-300">
              {solvent ? 'Pool is covering this month’s spend' : 'Spend is ahead of deposits'}
            </p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <Label>Total deposits & pool</Label>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${solvent ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {solvent ? 'Solvent' : 'Short'}
              </span>
            </div>
            <Value>{formatCurrency(data.totalDeposits)}</Value>
            <Rows
              rows={[
                ['Current cash pool', data.totalDeposits],
                ['Disbursed outflow', -data.totalExpense],
                ['Net surplus buffer', data.poolBalance],
              ]}
            />
          </Card>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-12">
          <div className="min-w-0 space-y-4 xl:col-span-7">
            <Card>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">Mess expense categorization</h2>
                  <p className="text-xs text-[#64748b]">Disbursement allocation across staple supplies and operating costs</p>
                </div>
                <span className="text-[11px] text-[#64748b]">{monthLabel(data.month, data.year)}</span>
              </div>
              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[#1e293b]">
                {bars.length === 0 ? (
                  <div className="h-full w-full bg-[#1e293b]" />
                ) : (
                  bars.map((bar) => (
                    <div key={bar.key} style={{ width: `${(bar.amount / barTotal) * 100}%`, background: bar.color }} />
                  ))
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#cbd5e1]">
                {bars.map((bar) => (
                  <span key={bar.key} className="inline-flex items-center gap-1.5">
                    <i className="h-2 w-2 rounded-full" style={{ background: bar.color }} />
                    {bar.label} ({Math.round((bar.amount / barTotal) * 100)}%) {formatCurrency(bar.amount)}
                  </span>
                ))}
                {bars.length === 0 && <span className="text-[#64748b]">No categorized spend yet.</span>}
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-3">
              <Mini label="Total purchases" value={String(data.expenseCount)} hint="Invoices this month" />
              <Mini label="Largest single run" value={formatCurrency(data.largestExpense)} hint="Highest expense" />
              <Mini
                label="Net pool remaining"
                value={formatCurrency(data.poolBalance)}
                hint={solvent ? 'Deposits still cover spend' : 'Deposits are short'}
              />
            </div>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Operational expense ledger</h2>
                  <p className="text-xs text-[#64748b]">Recorded receipts for this month</p>
                </div>
                <div className="flex max-w-full gap-1 overflow-x-auto pb-1">
                  {filters.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        filter === item ? 'bg-[#6d5efc] text-white' : 'bg-[#1e293b] text-[#94a3b8]'
                      }`}
                    >
                      {item}
                      {item === 'All' ? ` (${data.expenseCount})` : ''}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="mt-4 space-y-3 sm:hidden">
                {expenses.map((expense) => (
                  <li key={expense.id} className="rounded-xl border border-white/5 bg-[#0d1527] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rounded-md bg-[#1e293b] px-1.5 py-0.5 text-[10px] font-semibold text-[#c4b5fd]">
                          {expense.category}
                        </span>
                        <p className="mt-1 break-words font-medium">{expense.title}</p>
                        {expense.note && <p className="mt-0.5 text-xs text-[#64748b]">{expense.note}</p>}
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(expense.amount)}</p>
                    </div>
                    <p className="mt-2 text-xs text-[#94a3b8]">
                      {expense.createdBy?.name || 'Admin'} · {formatDate(expense.date)}
                    </p>
                  </li>
                ))}
                {expenses.length === 0 && <li className="text-sm text-[#64748b]">No expenses for this filter.</li>}
              </ul>
              <div className="mt-4 hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-[#64748b]">
                    <tr>
                      <th className="pb-2">Category & note</th>
                      <th className="pb-2">Purchaser</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-white/5">
                        <td className="py-3 pr-3">
                          <span className="mr-2 rounded-md bg-[#1e293b] px-1.5 py-0.5 text-[10px] font-semibold text-[#c4b5fd]">
                            {expense.category}
                          </span>
                          <span className="font-medium">{expense.title}</span>
                          {expense.note && <p className="mt-0.5 text-xs text-[#64748b]">{expense.note}</p>}
                        </td>
                        <td className="py-3 pr-3">
                          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1e293b] text-[10px] font-bold">
                            {initials(expense.createdBy?.name)}
                          </span>
                          <span className="text-xs text-[#cbd5e1]">{expense.createdBy?.name || 'Admin'}</span>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#94a3b8]">
                          {formatDate(expense.date)}
                          <p>#{expense.id.slice(-6)}</p>
                        </td>
                        <td className="py-3 text-right font-semibold tabular-nums">{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-sm text-[#64748b]">No expenses for this filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#64748b]">
                <span>Showing {expenses.length} of {data.expenseCount}</span>
                <Link href="/expenses" className="text-[#c4b5fd]">View all audit logs →</Link>
              </div>
            </Card>
          </div>

          <div className="min-w-0 space-y-4 xl:col-span-5">
            <div className={`rounded-2xl border p-4 ${data.dueCount > 0 ? 'border-rose-500/40 bg-rose-950/40' : 'border-emerald-500/30 bg-emerald-950/30'}`}>
              <h2 className="text-base font-semibold">
                {data.dueCount > 0 ? `Deficit warning: ${data.dueCount} member deficit${data.dueCount === 1 ? '' : 's'}` : 'All member balances are covered'}
              </h2>
              <p className="mt-1 text-sm text-[#cbd5e1]">
                {data.dueCount > 0
                  ? `${data.dueCount} members are below zero based on meals × meal rate.`
                  : 'Nobody is currently due for this month.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toast(data.dueCount ? 'Open the member list to follow up on dues.' : 'No dues to remind.')}
                  className="rounded-lg bg-[#6d5efc] px-3 py-2 text-xs font-semibold"
                >
                  Review due amounts
                </button>
                <Link href="/monthly-report" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold">
                  Open settlement
                </Link>
              </div>
            </div>

            <Card>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">Member ledger matrix</h2>
                  <p className="text-xs text-[#64748b]">Live breakdown per boarder</p>
                </div>
                <span className="text-xs font-semibold text-emerald-300">Rate {formatCurrency(data.mealRate)}</span>
              </div>
              <ul className="mt-3 space-y-3 sm:hidden">
                {data.memberBalances.slice(0, 6).map((member) => (
                  <li key={member.userId} className="rounded-xl border border-white/5 bg-[#0d1527] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-[11px] text-[#64748b]">{member.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${member.balance >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                        {formatCurrency(member.balance)} {member.balance >= 0 ? 'Ref' : 'Due'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#94a3b8]">
                      {member.totalMeals} meals · {formatCurrency(member.totalCost)} · deposited {formatCurrency(member.totalDeposit)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-[#64748b]">
                  <tr>
                    <th className="pb-2 text-left">Member</th>
                    <th className="pb-2 text-right">Meals</th>
                    <th className="pb-2 text-right">Cost</th>
                    <th className="pb-2 text-right">Deposit</th>
                    <th className="pb-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memberBalances.slice(0, 6).map((member) => (
                    <tr key={member.userId} className="border-t border-white/5">
                      <td className="py-2.5">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-[11px] text-[#64748b]">{member.email}</p>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{member.totalMeals}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatCurrency(member.totalCost)}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatCurrency(member.totalDeposit)}</td>
                      <td className="py-2.5 text-right">
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${member.balance >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                          {formatCurrency(member.balance)} {member.balance >= 0 ? 'Ref' : 'Due'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <button type="button" onClick={exportCsv} className="mt-3 text-left text-xs font-semibold text-[#c4b5fd]">
                Expand all members & generate ledger export (CSV)
              </button>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Audit & event stream</h2>
                <span className="text-[11px] font-semibold text-emerald-300">Live</span>
              </div>
              <ul className="mt-3 space-y-3">
                {data.recentActivity.length === 0 && <li className="text-sm text-[#64748b]">No activity yet.</li>}
                {data.recentActivity.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <p className="min-w-0 break-words">
                      <span className="font-medium">{item.user?.name || 'System'}</span>{' '}
                      <span className="text-[#94a3b8]">
                        {item.action.toLowerCase().replaceAll('_', ' ')} {item.entity.toLowerCase()}
                      </span>
                    </p>
                    <span className="shrink-0 text-[11px] text-[#64748b]">{timeAgo(item.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-white/5 bg-[#101628] p-4">{children}</section>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{children}</p>;
}

function Value({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`mt-1 break-words text-xl font-bold leading-tight tabular-nums sm:text-[28px] ${className}`}>{children}</p>;
}

function Rows({ rows, raw = false }: { rows: [string, number][]; raw?: boolean }) {
  return (
    <dl className="mt-3 space-y-1.5 text-xs">
      {rows.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-3 text-[#94a3b8]">
          <dt>{label}</dt>
          <dd className={`tabular-nums ${amount < 0 ? 'text-rose-300' : 'text-[#e2e8f0]'}`}>
            {raw ? amount.toLocaleString() : formatCurrency(amount)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/5 bg-[#101628] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{hint}</p>
    </div>
  );
}
