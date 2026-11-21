import { AlertCircle, CheckCircle2, Clock, Navigation, XCircle } from 'lucide-react';

export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: typeof Clock }> = {
    Pending: { cls: 'border-amber-200 bg-amber-50 text-amber-800', icon: Clock },
    Confirmed: { cls: 'border-blue-200 bg-blue-50 text-blue-800', icon: CheckCircle2 },
    Ongoing: { cls: 'border-indigo-200 bg-indigo-50 text-indigo-800', icon: Navigation },
    Completed: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
    Cancelled: { cls: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
    Approved: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
    Rejected: { cls: 'border-red-200 bg-red-50 text-red-800', icon: AlertCircle },
    Available: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
    Booked: { cls: 'border-blue-200 bg-blue-50 text-blue-800', icon: Navigation },
    'Under Maintenance': { cls: 'border-red-200 bg-red-50 text-red-800', icon: AlertCircle },
  };

  const entry = map[status] || { cls: 'border-slate-200 bg-slate-100 text-slate-700', icon: Clock };
  const Icon = entry.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${entry.cls}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {status}
    </span>
  );
}
