import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          {title && <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'bad' | 'accent';
}) {
  const tones = {
    default: 'from-slate-50 to-white dark:from-slate-900 dark:to-slate-950',
    good: 'from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-950',
    bad: 'from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-950',
    accent: 'from-teal-50 to-white dark:from-teal-950/40 dark:to-slate-950',
  };

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br p-4', tones[tone])}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
