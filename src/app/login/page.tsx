'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, hydrate, token, hydrated } = useAuthStore();
  const [email, setEmail] = useState('admin@mess.com');
  const [password, setPassword] = useState('password123');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && token) router.replace('/dashboard');
  }, [hydrated, token, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">Mess Manager</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Sign in to your mess</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track meals, expenses, deposits, and monthly balances.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="!bg-slate-900/70 !border-slate-700 !text-white"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="!bg-slate-900/70 !border-slate-700 !text-white"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Login
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Demo accounts (password: password123)</p>
          <ul className="mt-2 space-y-1">
            <li>superadmin@mess.com — Super Admin</li>
            <li>admin@mess.com — Admin</li>
            <li>rahim@mess.com — Member</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
