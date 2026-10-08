'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { MealCalendar } from '@/components/meals/MealCalendar';
import { MealEntryModal, type MealForm } from '@/components/meals/MealEntryModal';
import { ConfirmDialog } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { currentMonthYear, formatCurrency, monthLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Member {
  id: string;
  name: string;
}

interface DayMeal {
  id?: string;
  userId?: string;
  name?: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
  dailyTotal: number;
  note?: string;
}

export default function MealsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [members, setMembers] = useState<Member[]>([]);
  const [userId, setUserId] = useState('');
  const [editUserId, setEditUserId] = useState('');
  const [days, setDays] = useState<Record<string, DayMeal>>({});
  const [dayMembers, setDayMembers] = useState<Record<string, DayMeal[]>>({});
  const [hostelTotals, setHostelTotals] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState({
    totalMeals: 0,
    activeEaters: 0,
    mealRate: 0,
    userMeals: 0,
    isLocked: false,
  });
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState<MealForm>({ breakfast: 0, lunch: 1, dinner: 1, guestMeals: 0, note: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const editorRef = useRef({ open: false, date: '', userId: '' });
  editorRef.current = { open: modalOpen, date: selectedDate, userId: editUserId };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calRes = await api.get('/meals/calendar', {
        params: { month, year, ...(isAdmin && userId ? { userId } : {}) },
      });
      const data = calRes.data.data;
      const nextDays = (data.days || {}) as Record<string, DayMeal>;
      const nextMembers = (data.dayMembers || {}) as Record<string, DayMeal[]>;
      setDays(nextDays);
      setDayMembers(nextMembers);
      setHostelTotals(data.hostelTotals || {});
      setSummary(
        data.summary || { totalMeals: 0, activeEaters: 0, mealRate: 0, userMeals: 0, isLocked: false }
      );
      setLocked(!!data.summary?.isLocked);
      if (editorRef.current.open && editorRef.current.userId) {
        const meal = (nextMembers[editorRef.current.date] || []).find(
          (entry) => entry.userId === editorRef.current.userId
        );
        setForm(formFrom(meal));
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
      setMembers(res.data.data as Member[]);
    });
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const openDay = (dateKey: string) => {
    const people = dayMembers[dateKey] || [];
    const preferred = (userId && people.find((entry) => entry.userId === userId)) || people[0];
    const nextEditId = preferred?.userId || userId || members[0]?.id || user?.id || '';
    setSelectedDate(dateKey);
    setEditUserId(nextEditId);
    setForm(formFrom(people.find((entry) => entry.userId === nextEditId)));
    setModalOpen(true);
  };

  const saveMeal = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/meals/upsert', {
        date: selectedDate,
        ...form,
        ...(isAdmin && editUserId ? { userId: editUserId } : {}),
      });
      toast.success('Meal saved');
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const removeMeal = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/meals/${deleteId}`);
      toast.success('Meal deleted');
      setDeleteId(null);
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const currentMeal = (dayMembers[selectedDate] || []).find((entry) => entry.userId === editUserId);
  const monthMeals = Object.values(dayMembers).reduce((sum, people) => {
    const row = people.find((entry) => entry.userId === editUserId);
    return sum + (row?.dailyTotal || 0);
  }, 0);
  const selectedName = userId ? members.find((member) => member.id === userId)?.name : isAdmin ? 'All members' : user?.name;
  const showAll = isAdmin && !userId;

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
  };

  return (
    <AppShell title="Meals" roles={['ADMIN', 'MEMBER']}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">Dining ledger</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Daily meal tracker</h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
            {selectedName ? `${selectedName} · ` : ''}
            {monthLabel(month, year)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-xl border border-[#1e293b] bg-[#131b2e] p-2 text-[#cbd5e1]"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <select
            aria-label="Month"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className="rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2000, index, 1).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            aria-label="Year"
            type="number"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="w-24 rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm"
          />
          {isAdmin && (
            <select
              aria-label="Member"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="max-w-full rounded-xl border border-[#1e293b] bg-[#131b2e] px-3 py-2 text-sm"
            >
              <option value="">All members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-xl border border-[#1e293b] bg-[#131b2e] p-2 text-[#cbd5e1]"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Total month meals" value={summary.totalMeals.toLocaleString()} hint="Whole mess" />
        <Stat label="Active eaters" value={String(summary.activeEaters)} hint="Members with meals" />
        <Stat label="Meal rate" value={formatCurrency(summary.mealRate)} hint="Food expenses ÷ meals" />
        <Stat label={showAll ? 'Mess meals' : 'Selected meals'} value={summary.userMeals.toLocaleString()} hint={selectedName || 'This member'} />
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[#94a3b8]">
        <span className="rounded-full border border-[#1e293b] bg-[#131b2e] px-2.5 py-1">Breakfast</span>
        <span className="rounded-full border border-[#1e293b] bg-[#131b2e] px-2.5 py-1">Lunch</span>
        <span className="rounded-full border border-[#1e293b] bg-[#131b2e] px-2.5 py-1">Dinner</span>
        <span className="rounded-full border border-[#14b8a6]/40 px-2.5 py-1 text-[#99f6e4]">
          {showAll ? 'Each name is that member’s meals' : 'B / L / D is the selected member'}
        </span>
        <span>Total is the mess count for that day</span>
      </div>

      {locked && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          This month is locked. Meal edits are disabled.
        </div>
      )}

      <section className="mt-4 rounded-2xl border border-[#1e293b] bg-[#0d1527] p-3 sm:p-4">
        {loading ? (
          <LoadingState />
        ) : (
          <MealCalendar
            month={month}
            year={year}
            days={days}
            hostelTotals={hostelTotals}
            dayMembers={dayMembers}
            showAll={showAll}
            onDayClick={openDay}
            locked={locked}
          />
        )}
      </section>

      <MealEntryModal
        open={modalOpen}
        dateKey={selectedDate}
        form={form}
        members={isAdmin ? members : [{ id: user?.id || '', name: user?.name || 'You' }]}
        userId={isAdmin ? editUserId : user?.id || ''}
        canPickMember={isAdmin}
        monthMeals={monthMeals}
        saving={saving}
        locked={locked}
        canDelete={!!currentMeal?.id}
        onClose={() => setModalOpen(false)}
        onChange={setForm}
        onMemberChange={(nextId) => {
          setEditUserId(nextId);
          const meal = (dayMembers[selectedDate] || []).find((entry) => entry.userId === nextId);
          setForm(formFrom(meal));
        }}
        onSubmit={saveMeal}
        onDelete={() => currentMeal?.id && setDeleteId(currentMeal.id)}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={removeMeal}
        title="Delete meal"
        message="Are you sure you want to delete this meal entry?"
      />
    </AppShell>
  );
}

function formFrom(meal?: DayMeal): MealForm {
  return {
    breakfast: meal?.breakfast ?? 0,
    lunch: meal?.lunch ?? 1,
    dinner: meal?.dinner ?? 1,
    guestMeals: meal?.guestMeals ?? 0,
    note: meal?.note ?? '',
  };
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[#1e293b] bg-[#131b2e] p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b] sm:text-[11px]">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[#94a3b8]">{hint}</p>
    </div>
  );
}
