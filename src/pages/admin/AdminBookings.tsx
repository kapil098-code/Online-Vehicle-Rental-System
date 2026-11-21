import { FileText, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import InvoiceModal from '../../components/InvoiceModal';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { apiRequest, Booking, formatDateShort, formatINR } from '../../lib/api';
import AdminLayout from './AdminLayout';

const STATUSES = ['All', 'Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'] as const;

const VALID_NEXT: Record<string, string[]> = {
  Pending: ['Pending', 'Confirmed', 'Cancelled'],
  Confirmed: ['Confirmed', 'Ongoing', 'Cancelled'],
  Ongoing: ['Ongoing', 'Completed'],
  Completed: ['Completed'],
  Cancelled: ['Cancelled'],
};

export default function AdminBookings() {
  const { notify } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest<{ bookings: Booking[] }>('/admin/bookings', {
      params: {
        status: statusFilter === 'All' ? '' : statusFilter,
        search,
      },
    })
      .then((res) => setBookings(res.bookings))
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter, search, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (bookingId: number, status: string) => {
    try {
      const res = await apiRequest<{ message: string }>(`/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: { status },
      });
      notify(res.message, 'success');
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  return (
    <AdminLayout breadcrumb="Bookings">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, customer, vehicle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Lifecycle Transition</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Loading bookings…
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No matching bookings.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const options = VALID_NEXT[b.booking_status] || [b.booking_status];
                    return (
                      <tr key={b.booking_id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          #{b.booking_id}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{b.customer_name}</p>
                          <p className="text-xs text-slate-500">{b.customer_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{b.vehicle_name}</p>
                          <p className="font-mono text-xs text-slate-500">{b.registration_number}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                          {formatDateShort(b.start_date)} → {formatDateShort(b.end_date)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatINR(b.total_cost)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{b.payment_status}</td>
                        <td className="px-4 py-3">
                          {options.length <= 1 ? (
                            <StatusBadge status={b.booking_status} />
                          ) : (
                            <select
                              aria-label={`Change status for booking ${b.booking_id}`}
                              value={b.booking_status}
                              onChange={(e) => updateStatus(b.booking_id, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-900"
                            >
                              {options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInvoiceId(b.booking_id)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InvoiceModal bookingId={invoiceId} onClose={() => setInvoiceId(null)} />
    </AdminLayout>
  );
}
