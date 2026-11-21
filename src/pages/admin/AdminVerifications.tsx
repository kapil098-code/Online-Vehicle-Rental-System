import { Eye, RotateCw, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { apiRequest, User } from '../../lib/api';
import AdminLayout from './AdminLayout';

const TABS = ['Pending', 'Approved', 'Rejected', 'All'] as const;
const REJECT_PRESETS = [
  'Document photo is blurry or glare obscures text',
  'Please upload a valid Driving Licence for self-drive rentals',
  'ID number does not match uploaded document',
];

export default function AdminVerifications() {
  const { notify } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [statusTab, setStatusTab] = useState<string>('Pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [docPreview, setDocPreview] = useState<{
    name: string;
    id_type: string | null;
    id_number: string | null;
    dataUrl: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECT_PRESETS[0]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest<{ users: User[] }>('/admin/users', {
      params: { status: statusTab === 'All' ? '' : statusTab, search },
    })
      .then((res) => setUsers(res.users))
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusTab, search, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const inspectDocument = async (u: User) => {
    try {
      const res = await apiRequest<{
        documentData: string;
        name: string;
        id_type: string | null;
        id_number: string | null;
      }>(`/admin/users/${u.user_id}/document`);
      setZoom(1);
      setRotation(0);
      setDocPreview({
        name: res.name,
        id_type: res.id_type,
        id_number: res.id_number,
        dataUrl: res.documentData,
      });
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const approveUser = async (u: User) => {
    try {
      const res = await apiRequest<{ message: string }>(`/admin/users/${u.user_id}/verification`, {
        method: 'PUT',
        body: { status: 'Approved' },
      });
      notify(res.message, 'success');
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      notify('Please enter a rejection reason.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await apiRequest<{ message: string }>(`/admin/users/${rejectTarget.user_id}/verification`, {
        method: 'PUT',
        body: { status: 'Rejected', remark: rejectReason.trim() },
      });
      notify(res.message, 'success');
      setRejectTarget(null);
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout breadcrumb="KYC Verifications">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setStatusTab(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusTab === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">ID Type</th>
                  <th className="px-4 py-3">ID Number</th>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading KYC queue…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No customers in this queue.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">{u.phone}</td>
                      <td className="px-4 py-3 text-slate-700">{u.id_type || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{u.id_number || '—'}</td>
                      <td className="px-4 py-3">
                        {u.has_document ? (
                          <button
                            type="button"
                            onClick={() => inspectDocument(u)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect ID
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.verification_status} />
                        {u.verification_remark && (
                          <p className="mt-1 max-w-xs text-xs text-slate-500">{u.verification_remark}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {u.verification_status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => approveUser(u)}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                          {u.verification_status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(u);
                                setRejectReason(REJECT_PRESETS[0]);
                              }}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Document Inspector Lightbox */}
      {docPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setDocPreview(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">{docPreview.name}</h3>
                <p className="font-mono text-xs text-slate-500">
                  {docPreview.id_type} · {docPreview.id_number}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                  aria-label="Zoom out"
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                  aria-label="Zoom in"
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  aria-label="Rotate document"
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDocPreview(null)}
                  aria-label="Close document preview"
                  className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex max-h-[65vh] items-center justify-center overflow-auto rounded-lg bg-slate-100 p-4">
              <img
                src={docPreview.dataUrl}
                alt="Customer KYC Document"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                className="max-h-96 rounded-lg transition-transform duration-150"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal (Replaces window.prompt) */}
      <ConfirmModal
        open={Boolean(rejectTarget)}
        title={`Reject KYC · ${rejectTarget?.name}`}
        description="Select a preset reason or write a custom instruction shown to the customer when they re-upload."
        confirmLabel="Reject Verification"
        danger
        loading={busy}
        onConfirm={submitReject}
        onClose={() => setRejectTarget(null)}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {REJECT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRejectReason(preset)}
                className={`rounded-md border px-2.5 py-1 text-left text-xs transition-colors ${
                  rejectReason === preset
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </div>
      </ConfirmModal>
    </AdminLayout>
  );
}
