import { Eye, EyeOff, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, fileToCompressedDataUrl, User } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { notify } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    id_type: 'Driving Licence' as 'Driving Licence' | 'Aadhaar Card',
    id_number: '',
  });
  const [docPreview, setDocPreview] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setDocPreview(dataUrl);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!docPreview) {
      setError('Please upload a clear photo of your Driving Licence or Aadhaar Card.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User; message: string }>('/auth/register', {
        method: 'POST',
        body: { ...form, id_document_data: docPreview },
      });
      setSession(res.token, res.user);
      notify(res.message, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Create your RentRide account
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Complete your profile and upload a KYC document once for rapid self-drive pickup.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              Full Name
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Aarav Mehta"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Phone Number
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              Email Address
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Password (min 6 chars)
              <div className="relative mt-1.5">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>

          <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              ID Document Type
              <select
                value={form.id_type}
                onChange={(e) =>
                  setForm({ ...form, id_type: e.target.value as 'Driving Licence' | 'Aadhaar Card' })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                <option value="Driving Licence">Driving Licence</option>
                <option value="Aadhaar Card">Aadhaar Card (masked on save)</option>
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-700">
              {form.id_type === 'Aadhaar Card' ? '12-Digit Aadhaar Number' : 'Licence Number'}
              <input
                type="text"
                required
                value={form.id_number}
                onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                placeholder={form.id_type === 'Aadhaar Card' ? '123456789012' : 'HP0120210048912'}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </label>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700">Upload ID Front Photo</span>
            <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/30">
              {docPreview ? (
                <img src={docPreview} alt="Uploaded ID preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="mt-2 text-sm font-medium text-slate-700">
                    Click to select JPG or PNG
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">
                    Stored privately for admin verification only
                  </span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Creating Account…' : 'Create Account & Submit KYC'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
