import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { apiRequest, formatINR, Vehicle } from '../../lib/api';
import AdminLayout from './AdminLayout';

const EMPTY_FORM = {
  name: '',
  category: 'Car' as Vehicle['category'],
  model: '',
  transmission_type: 'Manual' as Vehicle['transmission_type'],
  fuel_type: 'Petrol' as Vehicle['fuel_type'],
  price_per_day: '',
  security_deposit: '3000',
  seats: '5',
  registration_number: '',
  mileage: '18 km/l',
  location: 'Shimla',
  status: 'Available' as Vehicle['status'],
  description: '',
};

export default function AdminVehicles() {
  const { notify } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest<{ vehicles: Vehicle[] }>('/vehicles', { params: { search, limit: 50 } })
      .then((res) => setVehicles(res.vehicles))
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.vehicle_id);
    setForm({
      name: v.name,
      category: v.category,
      model: v.model,
      transmission_type: v.transmission_type,
      fuel_type: v.fuel_type,
      price_per_day: String(v.price_per_day),
      security_deposit: String(v.security_deposit),
      seats: String(v.seats),
      registration_number: v.registration_number,
      mileage: v.mileage,
      location: v.location,
      status: v.status,
      description: v.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_per_day: Number(form.price_per_day),
        security_deposit: Number(form.security_deposit),
        seats: Number(form.seats),
      };
      const res = editingId
        ? await apiRequest<{ message: string }>(`/admin/vehicles/${editingId}`, {
            method: 'PUT',
            body: payload,
          })
        : await apiRequest<{ message: string }>('/admin/vehicles', {
            method: 'POST',
            body: payload,
          });
      notify(res.message, 'success');
      setModalOpen(false);
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>(`/admin/vehicles/${deleteTarget.vehicle_id}`, {
        method: 'DELETE',
      });
      notify(res.message, 'success');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      breadcrumb="Fleet Management"
      action={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Vehicle
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search fleet by name, model, or hub…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {vehicles.length} active vehicles
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Reg. Plate</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Hub</th>
                  <th className="px-4 py-3 text-right">Daily Rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading fleet…
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.vehicle_id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{v.name}</p>
                        <p className="text-xs text-slate-500">
                          {v.model} · {v.transmission_type} · {v.fuel_type}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {v.registration_number}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{v.category}</td>
                      <td className="px-4 py-3 text-slate-700">{v.location}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatINR(v.price_per_day)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(v)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(v)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Vehicle Details' : 'Add Vehicle to Fleet'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-700">
                Vehicle Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mahindra Scorpio-N"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Model / Trim
                <input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. 2024 Z8 4WD"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Vehicle['category'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>Car</option>
                  <option>SUV</option>
                  <option>Bike</option>
                  <option>Van</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Registration Plate
                <input
                  required
                  value={form.registration_number}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                  placeholder="HP-01A-9120"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Transmission
                <select
                  value={form.transmission_type}
                  onChange={(e) =>
                    setForm({ ...form, transmission_type: e.target.value as Vehicle['transmission_type'] })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>Manual</option>
                  <option>Automatic</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Fuel Type
                <select
                  value={form.fuel_type}
                  onChange={(e) => setForm({ ...form, fuel_type: e.target.value as Vehicle['fuel_type'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>CNG</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Daily Rate (INR)
                <input
                  type="number"
                  required
                  min={100}
                  value={form.price_per_day}
                  onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Security Deposit (INR)
                <input
                  type="number"
                  required
                  min={0}
                  value={form.security_deposit}
                  onChange={(e) => setForm({ ...form, security_deposit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Hub Location
                <input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Operational Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>Available</option>
                  <option>Booked</option>
                  <option>Under Maintenance</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Seats
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Efficiency / Range
                <input
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                Notes / Description
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Remove ${deleteTarget?.name}?`}
        description="This archives the vehicle from public listings while preserving past booking records. Vehicles with active bookings cannot be removed."
        confirmLabel="Remove Vehicle"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
