import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { apiRequest, formatINR } from '../../lib/api';
import AdminLayout from './AdminLayout';

interface AdminStats {
  totalCustomers: number;
  totalVehicles: number;
  availableVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
  mostRentedCategory: string;
  bookingsByStatus: Array<{ booking_status: string; count: number }>;
  categoryBreakdown: Array<{ category: string; bookings: number; revenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
}

export default function AdminHome() {
  const { notify } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ stats: AdminStats }>('/admin/stats')
      .then((res) => setStats(res.stats))
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const maxRev = stats
    ? Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1)
    : 1;

  return (
    <AdminLayout
      breadcrumb="Overview"
      action={
        <Link
          to="/admin/vehicles"
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
        >
          Manage Fleet
        </Link>
      }
    >
      {loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Collected Revenue</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatINR(stats.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">From settled online &amp; completed rentals</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Active Fleet</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {stats.availableVehicles} / {stats.totalVehicles}
              </p>
              <p className="mt-1 text-xs text-slate-500">Ready for dispatch · Top: {stats.mostRentedCategory}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Total Reservations</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {stats.totalBookings}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stats.totalCustomers} registered customers</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">KYC Queue</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {stats.pendingVerifications}
              </p>
              <p className="mt-1 text-xs">
                <Link to="/admin/verifications" className="font-medium text-blue-600 hover:underline">
                  Review customer IDs →
                </Link>
              </p>
            </div>
          </div>

          {/* Analytics Row */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Monthly Revenue Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    Monthly Revenue Trend
                  </h2>
                  <p className="text-xs text-slate-500">Settled rental volume over recent months</p>
                </div>
                <span className="font-mono text-xs text-slate-500">INR</span>
              </div>

              <div className="mt-8 flex h-52 items-end gap-4 border-b border-slate-100 pb-3">
                {stats.monthlyRevenue.map((m) => {
                  const pct = Math.max(8, Math.round((m.revenue / maxRev) * 100));
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                      <span className="font-mono text-[11px] font-medium text-slate-600 tabular-nums">
                        {formatINR(m.revenue)}
                      </span>
                      <div className="flex h-36 w-full max-w-[52px] items-end rounded-md bg-slate-100 p-1">
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full rounded-sm bg-blue-600 transition-all duration-300"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category & Status Breakdown */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Fleet Category Demand
                </h2>
                <div className="mt-4 space-y-3">
                  {stats.categoryBreakdown.map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{c.category}</span>
                      <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                        <span className="text-slate-500">{c.bookings} bookings</span>
                        <span className="font-semibold text-slate-900">{formatINR(c.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Bookings by Lifecycle Stage
                </h2>
                <div className="mt-4 space-y-2.5">
                  {stats.bookingsByStatus.map((s) => (
                    <div key={s.booking_status} className="flex items-center justify-between">
                      <StatusBadge status={s.booking_status} />
                      <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
