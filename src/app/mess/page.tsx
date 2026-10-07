'use client';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/EmptyState';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function MessPage() {
  const { fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', description: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/mess/mine');
        setExists(true);
        setForm({
          name: res.data.data.name || '',
          address: res.data.data.address || '',
          description: res.data.data.description || '',
        });
      } catch {
        setExists(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (exists) {
        await api.patch('/mess/mine', form);
        toast.success('Mess updated');
      } else {
        await api.post('/mess', form);
        toast.success('Mess created');
        setExists(true);
        await fetchMe();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Mess" roles={['ADMIN']}>
      {loading ? (
        <LoadingState />
      ) : (
        <Card title={exists ? 'Mess details' : 'Create your mess'}>
          <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-3">
            <Input
              label="Mess name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button type="submit" loading={saving}>
              {exists ? 'Save changes' : 'Create mess'}
            </Button>
          </form>
        </Card>
      )}
    </AppShell>
  );
}
