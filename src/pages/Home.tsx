import { Calendar, CheckCircle2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard';
import { apiRequest, Vehicle } from '../lib/api';

const HERO_IMG = '/src/assets/images/hero_himalayan_suv_1795285335402.jpg';
const CATEGORIES = ['All', 'Car', 'SUV', 'Bike', 'Van'] as const;

export default function Home() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<string[]>(['Shimla', 'Manali', 'Chandigarh', 'Dharamshala']);
  const [activeCat, setActiveCat] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState({
    location: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    apiRequest<{ vehicles: Vehicle[]; locations: string[] }>('/vehicles', { params: { limit: 12 } })
      .then((res) => {
        setVehicles(res.vehicles);
        if (res.locations.length) setLocations(res.locations);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCat === 'All' ? vehicles : vehicles.filter((v) => v.category === activeCat);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (query.location) qs.set('location', query.location);
    if (query.category) qs.set('category', query.category);
    if (query.startDate) qs.set('startDate', query.startDate);
    if (query.endDate) qs.set('endDate', query.endDate);
    navigate(`/vehicles${qs.toString() ? `?${qs.toString()}` : ''}`);
  };

  return (
    <div>
      {/* 1. Storefront Hero with integrated search module */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <img
          src={HERO_IMG}
          alt="Chartered 4x4 SUV overlooking Himalayan mountain highway"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-blue-300">
              Shimla · Manali · Chandigarh · Dharamshala
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-5xl">
              Self-drive vehicles engineered for mountain and city roads.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200">
              Verified fleet with transparent daily pricing, real-time date availability, and instant GST invoicing—zero hidden counter fees.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-10 grid gap-3 rounded-xl border border-white/15 bg-white p-4 text-slate-900 shadow-2xl sm:grid-cols-2 lg:grid-cols-5"
          >
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Pickup Hub
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={query.location}
                  onChange={(e) => setQuery({ ...query, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                >
                  <option value="">All Hubs</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Vehicle Type
              <select
                value={query.category}
                onChange={(e) => setQuery({ ...query, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                <option value="">Any Category</option>
                <option value="Car">Car</option>
                <option value="SUV">SUV</option>
                <option value="Bike">Bike</option>
                <option value="Van">Van</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Pickup Date
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  min={today}
                  value={query.startDate}
                  onChange={(e) =>
                    setQuery({
                      ...query,
                      startDate: e.target.value,
                      endDate: query.endDate && query.endDate <= e.target.value ? '' : query.endDate,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Return Date
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  min={query.startDate || today}
                  value={query.endDate}
                  onChange={(e) => setQuery({ ...query, endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                <Search className="h-4 w-4" />
                Search Fleet
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. Featured Fleet Collection */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Featured Fleet
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Inspected prior to every handover with comprehensive insurance included.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCat(cat)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeCat === cat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Link
              to="/vehicles"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              View all vehicles →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-88 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 6).map((v) => (
              <VehicleCard key={v.vehicle_id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* 3. How RentRide Works & Standards */}
      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              From online verification to keys in hand
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Skip counter paperwork. Complete KYC verification once and reserve any vehicle across our four hubs in seconds.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
              <span className="font-mono text-xs font-semibold text-blue-600">01</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Verify Driving Licence
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Upload your Driving Licence or Aadhaar once during onboarding. Admins approve verified profiles before pickup.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
              <span className="font-mono text-xs font-semibold text-blue-600">02</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Lock Exact Dates
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Interactive availability calendars block overlapping dates in real time, with transparent GST and deposit breakdowns.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
              <span className="font-mono text-xs font-semibold text-blue-600">03</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Inspect &amp; Drive Out
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pay online or at pickup, download your GST tax invoice from My Bookings, and cancel free up to 24 hours prior.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-slate-200 bg-slate-900 px-6 py-8 text-white sm:px-10">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-blue-400" />
              <div>
                <h3 className="font-display text-lg font-semibold">
                  24/7 Roadside Assistance &amp; Zero Hidden Fees
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Every booking includes comprehensive coverage, full sanitization, and documented hub handover.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" />
                Browse All Vehicles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
