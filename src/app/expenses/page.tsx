'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { currentMonthYear, formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<{ monthlyTotal: number; byCategory: Record<string, number> } | null>(null);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Rice',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses', {
        params: {
          month,
          year,
          page,
          limit: 10,
          ...(category ? { category } : {}),
          ...(search ? { search } : {}),
        },
      });
      setItems(res.data.data);
      setMeta(res.data.meta);
      setSummary(res.data.summary);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, year, page, category, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      category: 'Rice',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    });
    setModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date.slice(0, 10),
      note: expense.note || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.patch(`/expenses/${editing.id}`, payload);
      else await api.post('/expenses', payload);
      toast.success(editing ? 'Expense updated' : 'Expense created');
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast.success('Expense deleted');
      setDeleteId(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppShell title="Expenses" roles={['ADMIN', 'MEMBER']}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-500">Monthly total</p>
          <p className="text-xl font-bold">{formatCurrency(summary?.monthlyTotal || 0)}</p>
        </Card>
        {Object.entries(summary?.byCategory || {})
          .slice(0, 3)
          .map(([cat, amount]) => (
            <Card key={cat}>
              <p className="text-xs text-slate-500">{cat}</p>
              <p className="text-xl font-bold">{formatCurrency(amount)}</p>
            </Card>
          ))}
      </div>

      <Card
        title="Expense list"
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus size={16} /> Add
            </Button>
          ) : (
            <span className="text-xs text-slate-500">Read only</span>
          )
        }
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <Select
            value={month}
            onChange={(e) => {
              setPage(1);
              setMonth(Number(e.target.value));
            }}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
            }))}
          />
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            options={[
              { value: '', label: 'All categories' },
              ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState title="No expenses found" description="Try another month or add a new expense." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Amount</th>
                  {isAdmin && <th className="py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.title}</p>
                      {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
                    </td>
                    <td className="py-3 pr-3">{item.category}</td>
                    <td className="py-3 pr-3 font-medium">{formatCurrency(item.amount)}</td>
                    {isAdmin && (
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" className="!p-2" onClick={() => openEdit(item)}>
                            <Pencil size={16} />
                          </Button>
                          <Button variant="ghost" className="!p-2 text-rose-600" onClick={() => setDeleteId(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">{meta.total} results</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit expense' : 'Add expense'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input label="Amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        title="Delete expense"
        message="This expense will be permanently removed."
      />
    </AppShell>
  );
}
