'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] });

const highlights = [
  {
    title: 'Automated Meal Rate Engine',
    detail: 'Expenses ÷ total meals',
  },
  {
    title: 'Real-time Balance Ledger',
    detail: 'Deposits, cost, refund or due',
  },
  {
    title: 'Transparent Meal Audits',
    detail: 'Day-by-day breakfast, lunch, dinner',
  },
];

const roles = {
  admin: { label: 'Mess Admin' },
  member: { label: 'Hostel Member' },
} as const;

type RoleKey = keyof typeof roles;

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, hydrate, token, hydrated } = useAuthStore();
  const [role, setRole] = useState<RoleKey>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailInvalid = emailTouched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && token) router.replace('/dashboard');
  }, [hydrated, token, router]);

  const applyRole = (next: RoleKey) => {
    setRole(next);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      if (remember) localStorage.setItem('rememberDevice', '1');
      else localStorage.removeItem('rememberDevice');
      await login(email, password);
      toast.success('Welcome back');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    }
  };

  return (
    <div className={`${inter.className} relative min-h-screen overflow-hidden bg-[#020617] text-[#F8FAFC]`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(79,70,229,0.35),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)]" />
      <div className="pointer-events-none absolute left-1/3 top-16 h-72 w-72 rounded-full bg-[#4F46E5]/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-[1280px] items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-10">
        <section className="max-w-xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              MM
            </span>
            <div>
              <p className={`${jakarta.className} text-lg font-semibold tracking-tight`}>MessMate</p>
              <p className="text-xs text-[#94A3B8]">Hostel 7 Dining Portal</p>
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C3C0FF]">Welcome to MessMate</p>
          <h1 className={`${jakarta.className} mt-3 text-4xl font-bold leading-[44px] tracking-tight sm:text-[36px]`}>
            Hostel 7 Dining Portal
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#C7C4D8]">
            Sign in to the shared meal ledger. Meal rate, deposits, and monthly settlement stay visible to the right role.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-[#94A3B8]">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0F172A]/75 p-6 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
          <div className="grid grid-cols-2 rounded-lg border border-[#334155] bg-[#020617] p-1">
            {(Object.keys(roles) as RoleKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applyRole(key)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  role === key
                    ? 'bg-[#4F46E5] text-white shadow-[0_0_18px_rgba(79,70,229,0.45)]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {roles[key].label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Email</span>
              <span
                className={`flex h-11 items-center gap-2 rounded-md border bg-[#020617] px-3 ${
                  emailInvalid ? 'border-[#EF4444]' : 'border-[#334155] focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/35'
                }`}
              >
                <Mail size={16} className="text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  onBlur={() => setEmailTouched(true)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[#64748B]"
                  placeholder="you@mess.com"
                  required
                />
              </span>
              {emailInvalid && <span className="mt-1 block text-xs text-[#EF4444]">Enter a valid email</span>}
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                Password
                <button
                  type="button"
                  className="normal-case tracking-normal text-[#C3C0FF]"
                  onClick={() => toast('Ask your mess admin to reset this password.')}
                >
                  Forgot password?
                </button>
              </span>
              <span className="flex h-11 items-center gap-2 rounded-md border border-[#334155] bg-[#020617] px-3 focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/35">
                <Lock size={16} className="text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full w-full bg-transparent text-sm outline-none"
                  required
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[#94A3B8]" aria-label="Toggle password">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm text-[#C7C4D8]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[#475569] bg-transparent accent-[#4F46E5]"
              />
              Remember this device for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-sm font-semibold text-white shadow-[0_0_24px_rgba(79,70,229,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 border-t border-[#1E293B] pt-4 text-[11px] leading-4 text-[#94A3B8]">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#4EDEA3]" />
            <p>256-bit Encrypted Ledger · Role-based Middleware Guard · Audit Logged</p>
          </div>
        </section>
      </div>
    </div>
  );
}
