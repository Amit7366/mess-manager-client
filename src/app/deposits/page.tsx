'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { currentMonthYear, formatCurrency, formatDate } from '@/lib/utils';

interface Deposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
  user?: { name?: string; email?: string };
  userId: string;
}

interface Member {
  id: string;
  name: string;
}

export default function DepositsPage() {
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [items, setItems] = useState<Deposit[]>([]);
  const [balances, setBalances] = useState<{ userId: string; name: string; totalDeposit: number }[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deposit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [depRes, balRes, memRes] = await Promise.all([
        api.get('/deposits', { params: { month, year, limit: 50 } }),
        api.get('/deposits/balances', { params: { month, year } }),
        api.get('/users', { params: { role: 'MEMBER', limit: 100 } }),
      ]);
      setItems(depRes.data.data);
      setBalances(balRes.data.data);
      setMembers(memRes.data.data);
      setForm((f) => (f.userId || !memRes.data.data[0] ? f : { ...f, userId: memRes.data.data[0].id }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      userId: members[0]?.id || '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.patch(`/deposits/${editing.id}`, payload);
      else await api.post('/deposits', payload);
      toast.success(editing ? 'Deposit updated' : 'Deposit recorded');
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
      await api.delete(`/deposits/${deleteId}`);
      toast.success('Deposit deleted');
      setDeleteId(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppShell title="Deposits" roles={['ADMIN']}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {balances.map((b) => (
          <Card key={b.userId}>
            <p className="text-sm font-medium">{b.name}</p>
            <p className="mt-1 text-xl font-bold text-teal-700 dark:text-teal-300">
              {formatCurrency(b.totalDeposit)}
            </p>
            <p className="text-xs text-slate-500">Total deposit this month</p>
          </Card>
        ))}
      </div>

      <Card
        title="Deposit records"
        action={
          <div className="flex gap-2">
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2000, i, 1).toLocaleString('en', { month: 'short' }),
              }))}
            />
            <Input type="number" className="w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            <Button onClick={openCreate}>
              <Plus size={16} /> Add
            </Button>
          </div>
        }
      >
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState title="No deposits yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Date</th>
                  <th className="py-2">Member</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Note</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3">{formatDate(item.date)}</td>
                    <td className="py-3">{item.user?.name || item.userId}</td>
                    <td className="py-3 font-medium">{formatCurrency(item.amount)}</td>
                    <td className="py-3 text-slate-500">{item.note || '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          className="!p-2"
                          onClick={() => {
                            setEditing(item);
                            setForm({
                              userId: item.userId,
                              amount: String(item.amount),
                              date: item.date.slice(0, 10),
                              note: item.note || '',
                            });
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" className="!p-2 text-rose-600" onClick={() => setDeleteId(item.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit deposit' : 'Record deposit'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Select
            label="Member"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <Input label="Amount" type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        title="Delete deposit"
        message="Remove this deposit record?"
      />
    </AppShell>
  );
}
