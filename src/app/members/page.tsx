'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types';

export default function MembersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { role: 'MEMBER', search: search || undefined, limit: 100 },
      });
      setItems(res.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', password: 'password123', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (member: User) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      password: '',
      isActive: member.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editing.id}`, payload);
        toast.success('Member updated');
      } else {
        await api.post('/users/members', form);
        toast.success('Member created');
      }
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success(`${deleteTarget.name} has been deactivated`);
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const onReactivate = async (member: User) => {
    try {
      await api.patch(`/users/${member.id}`, { isActive: true });
      toast.success(`${member.name} reactivated`);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppShell title="Members" roles={['ADMIN']}>
      <Card
        title="Mess members"
        action={
          <div className="flex gap-2">
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Button onClick={openCreate}>
              <Plus size={16} /> Add member
            </Button>
          </div>
        }
      >
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState title="No members yet" description="Add members to start tracking meals." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 font-medium">{m.name}</td>
                    <td className="py-3">{m.email}</td>
                    <td className="py-3">{m.phone || '—'}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          m.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}
                      >
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">{m.createdAt ? formatDate(m.createdAt) : '—'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          className="!p-2"
                          onClick={() => openEdit(m)}
                          title="Edit member"
                        >
                          <Pencil size={16} />
                        </Button>
                        {m.isActive ? (
                          <Button
                            variant="ghost"
                            className="!p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => setDeleteTarget(m)}
                            title="Delete member"
                          >
                            <Trash2 size={16} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="!p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                            onClick={() => onReactivate(m)}
                            title="Reactivate member"
                          >
                            <RotateCcw size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit member' : 'Add member'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input
            label={editing ? 'New password (optional)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete member"
        message={`Deactivate ${deleteTarget?.name || 'this member'}? They will lose login access. Meal and deposit history is kept.`}
      />
    </AppShell>
  );
}
