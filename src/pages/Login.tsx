import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, User } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { notify } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setSession(res.token, res.user);
      notify(`Welcome back, ${res.user.name.split(' ')[0]}.`, 'success');
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@rental.com');
      setPassword('Admin@123');
    } else {
      setEmail('customer@rental.com');
      setPassword('Customer@123');
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Sign in to RentRide</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Access your reservations, GST invoices, or fleet administration.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-medium text-slate-700">
            Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Password
            <div className="relative mt-1.5">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-medium text-slate-500">Quick Demo Access</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('customer')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to RentRide?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
