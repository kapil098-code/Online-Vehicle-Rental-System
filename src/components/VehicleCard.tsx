import { Car, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, Vehicle } from '../lib/api';

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/vehicles/${vehicle.vehicle_id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {vehicle.image_url && !imgError ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.name} ${vehicle.model}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <Car className="h-10 w-10" />
            <span className="text-xs font-medium text-slate-500">{vehicle.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {vehicle.category} <span aria-hidden="true">·</span> {vehicle.model}
          </span>
          <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-700 tabular-nums">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {vehicle.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {vehicle.name}
        </h3>

        <p className="mt-1 text-xs text-slate-600">
          {vehicle.transmission_type} <span aria-hidden="true">·</span> {vehicle.fuel_type}{' '}
          <span aria-hidden="true">·</span> {vehicle.seats} Seats
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{vehicle.location}</span>
          <span aria-hidden="true">·</span>
          <span
            className={
              vehicle.status === 'Under Maintenance' ? 'font-medium text-red-600' : 'font-medium text-emerald-700'
            }
          >
            {vehicle.status}
          </span>
        </div>

        <div className="mt-auto flex items-baseline justify-between border-t border-slate-100 pt-4 mt-4">
          <div>
            <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
              {formatINR(vehicle.price_per_day)}
            </span>
            <span className="text-xs text-slate-500"> / day</span>
          </div>
          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
            View &amp; Book →
          </span>
        </div>
      </div>
    </Link>
  );
}
