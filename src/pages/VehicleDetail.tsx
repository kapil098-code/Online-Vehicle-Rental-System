import {
  ArrowLeft,
  Car,
  Check,
  CreditCard,
  Fuel,
  Gauge,
  MapPin,
  Shield,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import InvoiceModal from '../components/InvoiceModal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, Booking, daysBetween, formatDateShort, formatINR, Review, Vehicle } from '../lib/api';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bookedDates, setBookedDates] = useState<Array<{ start_date: string; end_date: string }>>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI / Card Online' | 'Cash on Pickup'>('UPI / Card Online');
  const [confirmedInvoiceId, setConfirmedInvoiceId] = useState<number | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadVehicle = useCallback(() => {
    apiRequest<{ vehicle: Vehicle; bookedDates: Array<{ start_date: string; end_date: string }>; reviews: Review[] }>(
      `/vehicles/${id}`
    )
      .then((res) => {
        setVehicle(res.vehicle);
        setBookedDates(res.bookedDates);
        setReviews(res.reviews);
      })
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, notify]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl bg-white lg:col-span-7" />
          <div className="h-96 animate-pulse rounded-xl bg-white lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Vehicle not found</h1>
        <Link to="/vehicles" className="mt-4 inline-block text-sm font-semibold text-blue-600">
          ← Back to fleet
        </Link>
      </div>
    );
  }

  const days = daysBetween(startDate, endDate);
  const baseCost = days * vehicle.price_per_day;
  const gst = Math.round(baseCost * 0.18);
  const totalPayable = baseCost + gst;

  const handleReserve = async () => {
    if (!user) {
      notify('Please sign in to reserve a vehicle.', 'info');
      navigate('/login');
      return;
    }
    if (days < 1) {
      notify('Select pickup and return dates on the calendar.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{ booking: Booking; message: string }>('/bookings', {
        method: 'POST',
        body: {
          vehicle_id: vehicle.vehicle_id,
          start_date: startDate,
          end_date: endDate,
          pickup_notes: pickupNotes.trim() || undefined,
        },
      });
      setPendingBooking(res.booking);
      notify(res.message, 'success');
      loadVehicle();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!pendingBooking) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/payments', {
        method: 'POST',
        body: {
          booking_id: pendingBooking.booking_id,
          payment_method: paymentMethod,
        },
      });
      notify(res.message, 'success');
      setConfirmedInvoiceId(pendingBooking.booking_id);
      setPendingBooking(null);
      setStartDate('');
      setEndDate('');
      loadVehicle();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      const res = await apiRequest<{ message: string }>(`/vehicles/${vehicle.vehicle_id}/reviews`, {
        method: 'POST',
        body: { rating: reviewRating, comment: reviewComment },
      });
      notify(res.message, 'success');
      setReviewComment('');
      loadVehicle();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/vehicles"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to fleet
      </Link>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-12">
        {/* Left: Imagery, Technical Specs & Reviews */}
        <div className="space-y-8 lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="aspect-[16/10] w-full bg-slate-100">
              {vehicle.image_url && !imgError ? (
                <img
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Car className="h-16 w-16" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {vehicle.category} <span aria-hidden="true">·</span> {vehicle.model}{' '}
                    <span aria-hidden="true">·</span>{' '}
                    <span className="font-mono">{vehicle.registration_number}</span>
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900">
                    {vehicle.name}
                  </h1>
                </div>
                <StatusBadge status={vehicle.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {vehicle.location} Hub
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {vehicle.rating.toFixed(1)} ({vehicle.review_count} reviews)
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">{vehicle.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
                <div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Gauge className="h-3.5 w-3.5" /> Transmission
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{vehicle.transmission_type}</p>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Fuel className="h-3.5 w-3.5" /> Fuel Type
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{vehicle.fuel_type}</p>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" /> Capacity
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{vehicle.seats} Seats</p>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Shield className="h-3.5 w-3.5" /> Efficiency
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{vehicle.mileage}</p>
                </div>
              </div>

              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-semibold text-slate-500">Included Equipment</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm text-slate-700">
                    {vehicle.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verified Reviews */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-slate-900">Renter Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews recorded yet for this vehicle.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {reviews.map((r) => (
                  <div key={r.review_id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">{r.user_name}</span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-700">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {r.rating}.0
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {user?.role === 'customer' && (
              <form onSubmit={submitReview} className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-slate-900">Share your trip experience</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Stars
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Comment on vehicle condition, pickup speed, mileage…"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right: Sticky Contiguous Purchase & Checkout Module */}
        <aside className="lg:sticky lg:top-24 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {formatINR(vehicle.price_per_day)}
                </span>
                <span className="text-sm text-slate-500"> / day</span>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                Deposit: {formatINR(vehicle.security_deposit)}
              </span>
            </div>

            {!pendingBooking ? (
              <div className="mt-5 space-y-5">
                <AvailabilityCalendar
                  bookedRanges={bookedDates}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(s, e) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-slate-500">Pickup Date</span>
                    <p className="mt-1 font-mono font-semibold text-slate-900">
                      {startDate ? formatDateShort(startDate) : 'Select on calendar'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-slate-500">Return Date</span>
                    <p className="mt-1 font-mono font-semibold text-slate-900">
                      {endDate ? formatDateShort(endDate) : 'Select on calendar'}
                    </p>
                  </div>
                </div>

                <label className="block text-xs font-medium text-slate-600">
                  Pickup Time or Special Notes (optional)
                  <input
                    type="text"
                    placeholder="e.g. Arriving 9:30 AM at Shimla hub"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </label>

                {days > 0 && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {formatINR(vehicle.price_per_day)} × {days} {days === 1 ? 'day' : 'days'}
                      </span>
                      <span className="font-mono tabular-nums">{formatINR(baseCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18%)</span>
                      <span className="font-mono tabular-nums">{formatINR(gst)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                      <span>Total Payable</span>
                      <span className="font-mono text-base tabular-nums">{formatINR(totalPayable)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Refundable deposit of {formatINR(vehicle.security_deposit)} collected at vehicle handover.
                    </p>
                  </div>
                )}

                {user?.role === 'customer' && user.verification_status !== 'Approved' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    KYC Status: <strong>{user.verification_status}</strong>.{' '}
                    <Link to="/dashboard" className="font-semibold underline">
                      Check My Bookings
                    </Link>{' '}
                    before reserving.
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting || vehicle.status === 'Under Maintenance' || days < 1}
                  onClick={handleReserve}
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {vehicle.status === 'Under Maintenance'
                    ? 'Currently Under Maintenance'
                    : submitting
                      ? 'Reserving Dates…'
                      : days > 0
                        ? `Reserve for ${formatINR(totalPayable)}`
                        : 'Select Dates to Reserve'}
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <p className="font-semibold">
                    Booking #{pendingBooking.booking_id} held for 30 minutes
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    {formatDateShort(pendingBooking.start_date)} → {formatDateShort(pendingBooking.end_date)} · Total{' '}
                    <strong className="font-mono tabular-nums">{formatINR(pendingBooking.total_cost)}</strong>
                  </p>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-slate-600">Select Payment Method</p>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI / Card Online')}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                      paymentMethod === 'UPI / Card Online'
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">UPI / Card Online</p>
                      <p className="text-xs text-slate-500">Instant confirmation &amp; GST receipt</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash on Pickup')}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                      paymentMethod === 'Cash on Pickup'
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="h-5 w-5 text-slate-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Pay at Hub Pickup</p>
                      <p className="text-xs text-slate-500">Confirm reservation now, settle at handover</p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePayment}
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Confirming…' : `Confirm & Pay ${formatINR(pendingBooking.total_cost)}`}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <InvoiceModal bookingId={confirmedInvoiceId} onClose={() => setConfirmedInvoiceId(null)} />
    </div>
  );
}
