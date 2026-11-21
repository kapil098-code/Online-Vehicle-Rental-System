import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="no-print border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="font-display text-lg font-bold tracking-tight text-slate-900">
              RentRide
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Verified self-drive cars, 4x4 SUVs, motorcycles, and group touring vans across Himachal and Chandigarh.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Fleet Categories</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link to="/vehicles?category=Car" className="hover:text-slate-900">Compact &amp; EV Cars</Link></li>
              <li><Link to="/vehicles?category=SUV" className="hover:text-slate-900">Mountain 4x4 SUVs</Link></li>
              <li><Link to="/vehicles?category=Bike" className="hover:text-slate-900">Cruisers &amp; Scooters</Link></li>
              <li><Link to="/vehicles?category=Van" className="hover:text-slate-900">Group Touring Vans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Pickup Hubs</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link to="/vehicles?location=Shimla" className="hover:text-slate-900">Shimla — Victory Tunnel</Link></li>
              <li><Link to="/vehicles?location=Manali" className="hover:text-slate-900">Manali — Mall Road Hub</Link></li>
              <li><Link to="/vehicles?location=Chandigarh" className="hover:text-slate-900">Chandigarh — Sector 17</Link></li>
              <li><Link to="/vehicles?location=Dharamshala" className="hover:text-slate-900">Dharamshala — McLeod Gate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Renting &amp; Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link to="/register" className="hover:text-slate-900">Instant KYC Onboarding</Link></li>
              <li><Link to="/dashboard" className="hover:text-slate-900">Manage Reservations</Link></li>
              <li className="text-slate-500">Free cancellation up to 24h before pickup</li>
              <li className="font-mono text-xs text-slate-500">support@rentride.in</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} RentRide Mobility Services. All rights reserved.</span>
          <span>Comprehensive Insurance · 24/7 Roadside Assistance</span>
        </div>
      </div>
    </footer>
  );
}
