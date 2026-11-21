import { CheckCircle2, CreditCard, FileText, ShieldCheck, Upload, Wallet } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import InvoiceModal from '../components/InvoiceModal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, Booking, fileToCompressedDataUrl, formatDateShort, formatINR } from '../lib/api';

const TABS = ['All', 'Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'] as const;

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const { notify } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('All');

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [payTarget, setPayTarget] = useState<Booking | null>(null);
  const [payMethod, setPayMethod] = useState<'UPI / Card Online' | 'Cash on Pickup'>('UPI / Card Online');
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [resubmitForm, setResubmitForm] = useState({
    id_type: 'Driving Licence' as 'Driving Licence' | 'Aadhaar Card',
    id_number: '',
    docData: '',
  });

  const loadBookings = useCallback(() => {
    setLoading(true);
    apiRequest<{ bookings: Booking[] }>('/bookings/my')
      .then((res) => setBookings(res.bookings))
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    refreshUser();
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const res = await apiRequest<{ message: string }>(`/bookings/${cancelTarget.booking_id}/cancel`, {
        method: 'PUT',
      });
      notify(res.message, 'success');
      setCancelTarget(null);
      loadBookings();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    setBusy(true);
    try {
      const res = await apiRequest<{ message: string }>('/payments', {
        method: 'POST',
        body: { booking_id: payTarget.booking_id, payment_method: payMethod },
      });
      notify(res.message, 'success');
      setPayTarget(null);
      loadBookings();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResubmitFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file);
    setResubmitForm((prev) => ({ ...prev, docData: dataUrl }));
  };

  const submitKyc = async (e: FormEvent) => {
    e.preventDefault();
    if (!resubmitForm.docData) {
      notify('Please select your updated ID document photo.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await apiRequest<{ message: string }>('/auth/resubmit-id', {
        method: 'POST',
        body: {
          id_type: resubmitForm.id_type,
          id_number: resubmitForm.id_number,
          id_document_data: resubmitForm.docData,
        },
      });
      notify(res.message, 'success');
      await refreshUser();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const visibleBookings =
    activeTab === 'All' ? bookings : bookings.filter((b) => b.booking_status === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track reservations, settle pending payments, and download GST invoices.
          </p>
        </div>
        <Link
          to="/vehicles"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
        >
          Book Another Vehicle
        </Link>
      </div>

      {/* KYC Verification Status Banner & Stepper */}
      {user?.role === 'customer' && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck
                className={`h-6 w-6 ${
                  user.verification_status === 'Approved'
                    ? 'text-emerald-600'
                    : user.verification_status === 'Rejected'
                      ? 'text-red-600'
                      : 'text-amber-600'
                }`}
              />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  KYC Identity Verification ({user.id_type || 'ID Document'}{' '}
                  {user.id_number ? `· ${user.id_number}` : ''})
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  {user.verification_status === 'Approved'
                    ? 'Your driving credentials are verified. You can book any vehicle instantly.'
                    : user.verification_status === 'Rejected'
                      ? user.verification_remark || 'Document could not be verified. Please re-upload below.'
                      : 'An administrator is reviewing your uploaded document before your first booking.'}
                </p>
              </div>
            </div>
            <StatusBadge status={user.verification_status} />
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>1. Account &amp; ID Uploaded</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                user.verification_status === 'Pending' ? 'font-semibold text-amber-700' : 'text-emerald-700'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>2. Admin Document Inspection</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                user.verification_status === 'Approved'
                  ? 'font-semibold text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>3. Ready for Self-Drive Booking</span>
            </div>
          </div>

          {user.verification_status === 'Rejected' && (
            <form
              onSubmit={submitKyc}
              className="mt-5 grid gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 sm:grid-cols-4"
            >
              <select
                value={resubmitForm.id_type}
                onChange={(e) =>
                  setResubmitForm({
                    ...resubmitForm,
                    id_type: e.target.value as 'Driving Licence' | 'Aadhaar Card',
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="Driving Licence">Driving Licence</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
              </select>
              <input
                type="text"
                required
                placeholder="Updated ID Number"
                value={resubmitForm.id_number}
                onChange={(e) => setResubmitForm({ ...resubmitForm, id_number: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm"
              />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                {resubmitForm.docData ? 'Photo Ready' : 'Upload New Photo'}
                <input type="file" accept="image/*" onChange={handleResubmitFile} className="hidden" />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {busy ? 'Uploading…' : 'Resubmit KYC'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Status Tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-slate-500 tabular-nums">
          {visibleBookings.length} {visibleBookings.length === 1 ? 'booking' : 'bookings'}
        </span>
      </div>

      {/* Bookings Table / List */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading reservations…</div>
        ) : visibleBookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-base font-semibold text-slate-900">No reservations here yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse available vehicles across our Himachal and Chandigarh hubs.
            </p>
            <Link
              to="/vehicles"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Explore Fleet
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Rental Dates</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleBookings.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      #{b.booking_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/vehicles/${b.vehicle_id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {b.vehicle_name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {b.model} · {b.location}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 tabular-nums">
                      {formatDateShort(b.start_date)} → {formatDateShort(b.end_date)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(b.total_cost)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={b.booking_status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {b.payment_status ? `${b.payment_status} · ${b.payment_method}` : 'Unpaid'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {b.booking_status === 'Pending' && !b.payment_status && (
                          <button
                            type="button"
                            onClick={() => setPayTarget(b)}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                          >
                            Pay Now
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setInvoiceId(b.booking_id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                        {['Pending', 'Confirmed'].includes(b.booking_status) && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(b)}
                            className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <ConfirmModal
        open={Boolean(cancelTarget)}
        title={`Cancel Booking #${cancelTarget?.booking_id}?`}
        description="Cancellations are permitted up to 24 hours before pickup. Any completed online payment will be marked for refund automatically."
        confirmLabel="Cancel Reservation"
        danger
        loading={busy}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />

      {/* Payment Modal */}
      <ConfirmModal
        open={Boolean(payTarget)}
        title={`Complete Payment · Booking #${payTarget?.booking_id}`}
        description={`Amount payable: ${formatINR(payTarget?.total_cost)}`}
        confirmLabel={`Confirm ${formatINR(payTarget?.total_cost)}`}
        loading={busy}
        onConfirm={handlePay}
        onClose={() => setPayTarget(null)}
      >
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setPayMethod('UPI / Card Online')}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${
              payMethod === 'UPI / Card Online' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'
            }`}
          >
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-900">UPI / Card Online</span>
          </button>
          <button
            type="button"
            onClick={() => setPayMethod('Cash on Pickup')}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${
              payMethod === 'Cash on Pickup' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'
            }`}
          >
            <Wallet className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Pay at Hub Pickup</span>
          </button>
        </div>
      </ConfirmModal>

      <InvoiceModal bookingId={invoiceId} onClose={() => setInvoiceId(null)} />
    </div>
  );
}
