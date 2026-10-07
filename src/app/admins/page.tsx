'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types';

export default function AdminsPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { role: 'ADMIN', limit: 100 } });
      setItems(res.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users/admins', form);
      toast.success('Admin created');
      setModalOpen(false);
      setForm({ name: '', email: '', phone: '', password: 'password123' });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Admins" roles={['SUPER_ADMIN']}>
      <Card
        title="Mess admins"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Create admin
          </Button>
        }
      >
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState title="No admins yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 font-medium">{a.name}</td>
                    <td className="py-3">{a.email}</td>
                    <td className="py-3">{a.phone || '—'}</td>
                    <td className="py-3">{a.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="py-3">{a.createdAt ? formatDate(a.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create admin">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
