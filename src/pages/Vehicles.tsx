import { Car, RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard';
import { apiRequest, Vehicle } from '../lib/api';

const CATEGORIES = ['All', 'Car', 'SUV', 'Bike', 'Van'];

export default function Vehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    transmission: searchParams.get('transmission') || '',
    fuel: searchParams.get('fuel') || '',
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    sort: searchParams.get('sort') || 'featured',
  });

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    setSearchParams(params, { replace: true });

    apiRequest<{ vehicles: Vehicle[]; locations: string[] }>('/vehicles', { params })
      .then((res) => {
        setVehicles(res.vehicles);
        setLocations(res.locations);
      })
      .finally(() => setLoading(false));
  }, [filters, setSearchParams]);

  const resetFilters = () => {
    setFilters({
      category: '',
      location: '',
      transmission: '',
      fuel: '',
      search: '',
      startDate: '',
      endDate: '',
      sort: 'featured',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Browse Fleet
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter by hub, fuel, transmission, or exact pickup dates to see live availability.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          {CATEGORIES.map((cat) => {
            const val = cat === 'All' ? '' : cat;
            const active = filters.category === val;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilters({ ...filters, category: val })}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-7">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search model, name, hub…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
        >
          <option value="">All Hubs</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by transmission"
          value={filters.transmission}
          onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
        >
          <option value="">Any Transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>

        <select
          aria-label="Filter by fuel"
          value={filters.fuel}
          onChange={(e) => setFilters({ ...filters, fuel: e.target.value })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
        >
          <option value="">Any Fuel</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
          <option value="CNG">CNG</option>
        </select>

        <select
          aria-label="Sort fleet"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
        >
          <option value="featured">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 sm:col-span-2 lg:col-span-7">
          <span className="text-xs font-medium text-slate-500">Check date availability:</span>
          <input
            type="date"
            aria-label="Pickup date"
            min={today}
            value={filters.startDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                startDate: e.target.value,
                endDate: filters.endDate && filters.endDate <= e.target.value ? '' : filters.endDate,
              })
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            aria-label="Return date"
            min={filters.startDate || today}
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900"
          />
          <span className="ml-auto font-mono text-xs text-slate-500 tabular-nums">
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} available
          </span>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-88 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Car className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
            No matching vehicles found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your date range or selecting a nearby hub.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.vehicle_id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
