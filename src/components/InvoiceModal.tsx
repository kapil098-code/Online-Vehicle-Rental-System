import { Printer, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiRequest, Booking, formatDateShort, formatINR } from '../lib/api';

interface InvoiceData {
  invoice_number: string;
  issued_at: string;
  booking: Booking;
  customer: { name: string; email: string; phone: string } | null;
  vehicle: {
    name: string;
    model: string;
    registration_number: string;
    location: string;
    price_per_day: number;
  } | null;
  payment: {
    payment_method: string;
    payment_status: string;
    transaction_id: string | null;
    refund_id: string | null;
  } | null;
}

export default function InvoiceModal({
  bookingId,
  onClose,
}: {
  bookingId: number | null;
  onClose: () => void;
}) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setInvoice(null);
      return;
    }
    setError('');
    apiRequest<{ invoice: InvoiceData }>(`/bookings/${bookingId}/invoice`)
      .then((res) => setInvoice(res.invoice))
      .catch((err: Error) => setError(err.message));
  }, [bookingId]);

  if (!bookingId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="no-print mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <span className="text-sm font-medium text-slate-600">Rental Tax Invoice</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!invoice && !error && <p className="py-12 text-center text-sm text-slate-500">Generating invoice…</p>}

        {invoice && (
          <div className="space-y-6 text-sm text-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <p className="font-display text-2xl font-bold tracking-tight text-slate-900">RentRide</p>
                <p className="mt-1 text-xs text-slate-500">
                  Himalayan Mobility & Self-Drive Fleet Services · GSTIN 02AABCR4812K1Z9
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-base font-semibold text-slate-900 tabular-nums">
                  {invoice.invoice_number}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Booking #{invoice.booking.booking_id} · Status: {invoice.booking.booking_status}
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Billed To</p>
                <p className="mt-1 font-semibold text-slate-900">{invoice.customer?.name}</p>
                <p className="text-slate-600">{invoice.customer?.email}</p>
                <p className="font-mono text-xs text-slate-600 tabular-nums">{invoice.customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Assigned Vehicle</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {invoice.vehicle?.name} ({invoice.vehicle?.model})
                </p>
                <p className="text-slate-600">Hub: {invoice.vehicle?.location}</p>
                <p className="font-mono text-xs text-slate-600">Reg: {invoice.vehicle?.registration_number}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  Rental Period:{' '}
                  <strong className="font-mono text-slate-900">
                    {formatDateShort(invoice.booking.start_date)} → {formatDateShort(invoice.booking.end_date)}
                  </strong>
                </span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {invoice.booking.days} {invoice.booking.days === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>

            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3">
                    Vehicle Rental ({formatINR(invoice.vehicle?.price_per_day)} × {invoice.booking.days} days)
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">
                    {formatINR(invoice.booking.base_amount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3">GST (18%)</td>
                  <td className="py-3 text-right font-mono tabular-nums">
                    {formatINR(invoice.booking.gst_amount)}
                  </td>
                </tr>
                <tr className="font-semibold text-slate-900">
                  <td className="py-3">Total Rental Payable</td>
                  <td className="py-3 text-right font-mono text-base tabular-nums">
                    {formatINR(invoice.booking.total_cost)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <span>
                Refundable security deposit at hub pickup:{' '}
                <strong className="font-mono text-slate-800 tabular-nums">
                  {formatINR(invoice.booking.security_deposit)}
                </strong>
              </span>
              <span className="font-mono">
                {invoice.payment
                  ? `${invoice.payment.payment_status} · ${invoice.payment.payment_method}${
                      invoice.payment.transaction_id ? ` (${invoice.payment.transaction_id})` : ''
                    }`
                  : 'Payment Pending'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
