'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DayMeal {
  id?: string;
  userId?: string;
  name?: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
  dailyTotal: number;
  note?: string;
}

export function MealCalendar({
  month,
  year,
  days,
  hostelTotals,
  dayMembers,
  showAll,
  onDayClick,
  locked,
}: {
  month: number;
  year: number;
  days: Record<string, DayMeal>;
  hostelTotals: Record<string, number>;
  dayMembers: Record<string, DayMeal[]>;
  showAll?: boolean;
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

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748b] sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`pad-${idx}`} className="min-h-[88px] sm:min-h-[118px]" />;
          const meal = cell.meal;
          const people = dayMembers[cell.key] || [];
          const hostel = hostelTotals[cell.key] ?? 0;
          const active = showAll ? hostel > 0 : (meal?.dailyTotal ?? 0) > 0 || hostel > 0;
          const isToday = cell.key === todayKey;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={locked}
              onClick={() => onDayClick(cell.key, meal)}
              className={cn(
                'flex min-h-[88px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[118px] sm:p-2.5',
                active
                  ? 'border-[#14b8a6]/50 bg-[#10262a] shadow-[0_0_0_1px_rgba(20,184,166,0.15)]'
                  : 'border-[#1e293b] bg-[#101628] hover:border-[#334155]',
                isToday && 'ring-1 ring-[#6366f1]',
                locked && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold text-[#f8fafc]">{cell.day}</span>
                <span className="hidden text-[9px] font-semibold uppercase text-[#64748b] sm:inline">
                  {locked ? 'Locked' : active ? 'Open' : 'Off'}
                </span>
              </div>
              {showAll ? (
                <ul className="mt-1 space-y-0.5">
                  {people.length === 0 && <li className="text-[10px] text-[#64748b]">No meals</li>}
                  {people.map((person) => (
                    <li key={person.userId || person.name} className="truncate text-[10px] leading-tight text-[#99f6e4] sm:text-[11px]">
                      {person.name} · {person.dailyTotal}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="mt-1 text-[10px] leading-tight text-[#99f6e4] sm:text-[11px]">
                    B:{meal?.breakfast ?? 0} · L:{meal?.lunch ?? 0} · D:{meal?.dinner ?? 0}
                  </p>
                  {(meal?.guestMeals ?? 0) > 0 && (
                    <p className="text-[10px] text-[#fbbf24]">Guest {meal?.guestMeals}</p>
                  )}
                </>
              )}
              <p className="mt-auto pt-1 text-[10px] text-[#94a3b8] sm:text-[11px]">Total: {hostel}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
