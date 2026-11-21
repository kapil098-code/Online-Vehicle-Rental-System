import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

interface BookedRange {
  start_date: string;
  end_date: string;
}

interface AvailabilityCalendarProps {
  bookedRanges: BookedRange[];
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AvailabilityCalendar({
  bookedRanges,
  startDate,
  endDate,
  onChange,
}: AvailabilityCalendarProps) {
  const todayStr = toIsoDate(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const days = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ iso: toIsoDate(new Date(year, month, d)), day: d });
    }
    return cells;
  }, [year, month]);

  const isDateBooked = (iso: string) =>
    bookedRanges.some((r) => iso >= r.start_date && iso < r.end_date);

  const rangeOverlapsBooked = (start: string, end: string) =>
    bookedRanges.some((r) => r.start_date < end && r.end_date > start);

  const handleDayClick = (iso: string) => {
    if (iso < todayStr || isDateBooked(iso)) return;

    if (!startDate || (startDate && endDate)) {
      onChange(iso, '');
      return;
    }

    if (iso <= startDate) {
      onChange(iso, '');
      return;
    }

    if (rangeOverlapsBooked(startDate, iso)) {
      onChange(iso, '');
      return;
    }

    onChange(startDate, iso);
  };

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} />;
          const past = cell.iso < todayStr;
          const booked = isDateBooked(cell.iso);
          const disabled = past || booked;
          const isStart = cell.iso === startDate;
          const isEnd = cell.iso === endDate;
          const inRange = Boolean(startDate && endDate && cell.iso > startDate && cell.iso < endDate);

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(cell.iso)}
              title={booked ? 'Already reserved' : past ? 'Past date' : cell.iso}
              className={`h-9 rounded-lg font-mono text-xs tabular-nums transition-colors ${
                isStart || isEnd
                  ? 'bg-blue-600 font-semibold text-white'
                  : inRange
                    ? 'bg-blue-50 font-medium text-blue-700'
                    : booked
                      ? 'cursor-not-allowed bg-red-50 text-red-400 line-through'
                      : past
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span>Click pickup date, then return date</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-blue-600" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-red-100" />
            Booked
          </span>
        </div>
      </div>
    </div>
  );
}
