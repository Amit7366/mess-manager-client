'use client';

import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/change-password', form);
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings" roles={['ADMIN', 'MEMBER', 'SUPER_ADMIN']}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium">{user?.role.replace('_', ' ')}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Change password">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="Current password"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
            <Input
              label="New password"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
              minLength={6}
            />
            <Button type="submit" loading={saving}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
