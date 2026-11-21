import {
  ArrowLeft,
  CalendarCheck,
  Car,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/vehicles', label: 'Fleet Management', icon: Car, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { to: '/admin/verifications', label: 'KYC Verifications', icon: ShieldCheck, end: false },
];

export default function AdminLayout({
  breadcrumb,
  action,
  children,
}: {
  breadcrumb: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-200 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-white">
            RentRide
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Storefront View
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out ({user?.name.split(' ')[0]})
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Operations</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-3">{action}</div>
        </header>

        {/* Mobile Nav Strip */}
        <div className="no-print flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/" className="ml-auto text-xs font-medium text-blue-600 whitespace-nowrap shrink-0">
            Storefront
          </Link>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
