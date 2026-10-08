'use client';

import { FormEvent, useEffect } from 'react';
import { Check, Minus, Plus, Trash2, X } from 'lucide-react';

export type MealForm = {
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
  note: string;
};

type MemberOption = { id: string; name: string };

const presets = [
  { key: 'standard', label: 'Standard (L+D)', values: { breakfast: 0, lunch: 1, dinner: 1, guestMeals: 0 } },
  { key: 'all', label: 'All Meals (3)', values: { breakfast: 1, lunch: 1, dinner: 1, guestMeals: 0 } },
  { key: 'skip', label: 'Skip Today', values: { breakfast: 0, lunch: 0, dinner: 0, guestMeals: 0 } },
] as const;

function headingDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}

export function MealEntryModal({
  open,
  dateKey,
  form,
  members,
  userId,
  canPickMember,
  monthMeals,
  saving,
  locked,
  canDelete,
  onClose,
  onChange,
  onMemberChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  dateKey: string;
  form: MealForm;
  members: MemberOption[];
  userId: string;
  canPickMember: boolean;
  monthMeals: number;
  saving: boolean;
  locked: boolean;
  canDelete: boolean;
  onClose: () => void;
  onChange: (next: MealForm) => void;
  onMemberChange: (userId: string) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const personal = form.breakfast + form.lunch + form.dinner;
  const total = personal + form.guestMeals;
  const status = total === 0 ? 'Off' : personal === 0 ? 'Guest' : 'Regular';
  const activePreset = presets.find(
    (preset) =>
      preset.values.breakfast === form.breakfast &&
      preset.values.lunch === form.lunch &&
      preset.values.dinner === form.dinner &&
      preset.values.guestMeals === form.guestMeals
  )?.key;

  const setCount = (field: keyof Pick<MealForm, 'breakfast' | 'lunch' | 'dinner' | 'guestMeals'>, next: number) => {
    onChange({ ...form, [field]: Math.max(0, next) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Close meal editor" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative z-10 max-h-[92vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl border border-[#263352] bg-[#10182c] p-4 text-[#f8fafc] shadow-2xl sm:rounded-3xl sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#2dd4bf]" />
              Log & Edit Meals
            </h2>
            <p className="mt-1 text-xs text-[#94a3b8]">{headingDate(dateKey)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#94a3b8] hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#263352] bg-[#0d1527] p-3">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#2dd4bf]">
            Select member / resident
          </label>
          <select
            value={userId}
            disabled={!canPickMember}
            onChange={(event) => onMemberChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#334155] bg-[#162033] px-3 py-2.5 text-sm outline-none disabled:opacity-80"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-[#94a3b8]">Current month meals logged: {monthMeals}</span>
            <span className="font-semibold text-[#2dd4bf]">Meal status: {status}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={locked}
              onClick={() => onChange({ ...form, ...preset.values })}
              className={`rounded-xl border px-2 py-2 text-[11px] font-semibold sm:text-xs ${
                activePreset === preset.key
                  ? preset.key === 'skip'
                    ? 'border-rose-400/50 bg-rose-500/15 text-rose-300'
                    : 'border-[#2dd4bf]/50 bg-[#2dd4bf]/10 text-[#99f6e4]'
                  : preset.key === 'skip'
                    ? 'border-rose-500/30 bg-transparent text-rose-300'
                    : 'border-[#263352] bg-[#162033] text-[#cbd5e1]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Counter
            label="Breakfast"
            hint="Morning"
            value={form.breakfast}
            disabled={locked}
            onChange={(value) => setCount('breakfast', value)}
          />
          <Counter
            label="Lunch"
            hint={form.lunch > 0 ? `${form.lunch} Selected` : 'Midday'}
            value={form.lunch}
            active={form.lunch > 0}
            disabled={locked}
            onChange={(value) => setCount('lunch', value)}
          />
          <Counter
            label="Dinner"
            hint={form.dinner > 0 ? `${form.dinner} Selected` : 'Evening'}
            value={form.dinner}
            active={form.dinner > 0}
            disabled={locked}
            onChange={(value) => setCount('dinner', value)}
          />
          <Counter
            label="Guest meals"
            hint="Counts as 1 meal"
            value={form.guestMeals}
            disabled={locked}
            onChange={(value) => setCount('guestMeals', value)}
          />
        </div>

        <label className="mt-3 block text-xs text-[#94a3b8]">
          Note / remarks (optional)
          <input
            value={form.note}
            onChange={(event) => onChange({ ...form, note: event.target.value })}
            placeholder="E.g., vegetarian prep, arrived late, or guest name"
            className="mt-1.5 w-full rounded-xl border border-[#263352] bg-[#0d1527] px-3 py-2.5 text-sm text-[#f8fafc] outline-none placeholder:text-[#64748b]"
          />
        </label>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#263352] bg-[#0d1527] px-3 py-2.5 text-sm">
          <span className="text-[#94a3b8]">Day total for selected user</span>
          <span className="font-semibold text-[#2dd4bf]">
            {personal} member meal{personal === 1 ? '' : 's'} + {form.guestMeals} guest
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white"
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#334155] px-3 py-2 text-sm font-semibold text-[#cbd5e1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || locked}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14b8a6] px-3 py-2 text-sm font-semibold text-[#042f2e] disabled:opacity-60"
            >
              <Check size={15} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Counter({
  label,
  hint,
  value,
  active,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  active?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${active ? 'border-[#2dd4bf]/50 bg-[#10262a]' : 'border-[#263352] bg-[#0d1527]'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-semibold ${active ? 'text-[#5eead4]' : ''}`}>{label}</p>
        <p className={`text-[10px] ${active ? 'text-[#5eead4]' : 'text-[#64748b]'}`}>{hint}</p>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-[#263352] bg-[#10182c] px-1 py-1">
        <button
          type="button"
          disabled={disabled || value <= 0}
          onClick={() => onChange(value - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#cbd5e1] hover:bg-white/5 disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={14} />
        </button>
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(value + 1)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            active ? 'bg-[#14b8a6] text-[#042f2e]' : 'text-[#cbd5e1] hover:bg-white/5'
          }`}
          aria-label={`Increase ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
