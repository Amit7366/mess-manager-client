'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DayMeal {
  id?: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
  dailyTotal: number;
}

export function MealCalendar({
  month,
  year,
  days,
  onDayClick,
  locked,
}: {
  month: number;
  year: number;
  days: Record<string, DayMeal>;
  onDayClick: (dateKey: string, meal?: DayMeal) => void;
  locked?: boolean;
}) {
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const startPad = first.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const result: ({ key: string; day: number; meal?: DayMeal } | null)[] = [];

    for (let i = 0; i < startPad; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ key, day: d, meal: days[key] });
    }
    return result;
  }, [month, year, days]);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`pad-${idx}`} />;
          const total = cell.meal?.dailyTotal ?? 0;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={locked}
              onClick={() => onDayClick(cell.key, cell.meal)}
              className={cn(
                'aspect-square rounded-lg border p-1 text-left transition sm:p-2',
                total > 0
                  ? 'border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/40'
                  : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900',
                locked && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{cell.day}</div>
              {total > 0 && (
                <div className="mt-1 text-[10px] sm:text-xs text-teal-700 dark:text-teal-300">
                  {total} meal{total !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
