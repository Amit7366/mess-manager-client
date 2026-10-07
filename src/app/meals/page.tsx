'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { MealCalendar } from '@/components/meals/MealCalendar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { currentMonthYear, monthLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Member {
  id: string;
  name: string;
}

interface DayMeal {
  id?: string;
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
  const [days, setDays] = useState<Record<string, DayMeal>>({});
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ breakfast: 0, lunch: 1, dinner: 1, guestMeals: 0, note: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [calRes, settingRes] = await Promise.all([
        api.get('/meals/calendar', {
          params: { month, year, ...(isAdmin && userId ? { userId } : {}) },
        }),
        api.get('/month-settings', { params: { month, year } }),
      ]);
      setDays(calRes.data.data.days || {});
      setLocked(!!settingRes.data.data.isLocked);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, year, userId, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users', { params: { role: 'MEMBER', limit: 100 } }).then((res) => {
      const items = res.data.data as Member[];
      setMembers(items);
      if (!userId && items[0]) setUserId(items[0].id);
    });
  }, [isAdmin, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDay = (dateKey: string, meal?: DayMeal) => {
    setSelectedDate(dateKey);
    setForm({
      breakfast: meal?.breakfast ?? 0,
      lunch: meal?.lunch ?? 1,
      dinner: meal?.dinner ?? 1,
      guestMeals: meal?.guestMeals ?? 0,
      note: meal?.note ?? '',
    });
    setModalOpen(true);
  };

  const saveMeal = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/meals/upsert', {
        date: selectedDate,
        ...form,
        ...(isAdmin && userId ? { userId } : {}),
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

  const currentMeal = days[selectedDate];

  return (
    <AppShell title="Meals" roles={['ADMIN', 'MEMBER']}>
      <Card
        title={monthLabel(month, year)}
        action={
          <div className="flex flex-wrap gap-2">
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2000, i, 1).toLocaleString('en', { month: 'short' }),
              }))}
            />
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24"
            />
            {isAdmin && (
              <Select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                options={members.map((m) => ({ value: m.id, label: m.name }))}
              />
            )}
          </div>
        }
      >
        {locked && (
          <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            This month is locked. Meal edits are disabled.
          </div>
        )}
        {loading ? (
          <LoadingState />
        ) : (
          <MealCalendar
            month={month}
            year={year}
            days={days}
            onDayClick={openDay}
            locked={locked}
          />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Meal — ${selectedDate}`}>
        <form onSubmit={saveMeal} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(['breakfast', 'lunch', 'dinner', 'guestMeals'] as const).map((field) => (
              <Input
                key={field}
                label={field === 'guestMeals' ? 'Guest meals' : field[0].toUpperCase() + field.slice(1)}
                type="number"
                min={0}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
              />
            ))}
          </div>
          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="flex justify-between pt-2">
            {currentMeal?.id ? (
              <Button type="button" variant="danger" onClick={() => setDeleteId(currentMeal.id!)}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={locked}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </Modal>

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
