import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors ${
      isActive ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          RentRide
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/vehicles" className={linkClass}>
            Fleet
          </NavLink>
          {user?.role === 'customer' && (
            <NavLink to="/dashboard" className={linkClass}>
              My Bookings
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin Console
            </NavLink>
          )}
          {!user && (
            <NavLink to="/login" className={linkClass}>
              Sign In
            </NavLink>
          )}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="hidden md:flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-700">
              Home
            </Link>
            <Link to="/vehicles" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-700">
              Fleet
            </Link>
            {user?.role === 'customer' && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-700">
                My Bookings
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-700">
                Admin Console
              </Link>
            )}
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-1 rounded-lg border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700"
              >
                Sign Out
              </button>
            ) : (
              <div className="mt-1 flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
