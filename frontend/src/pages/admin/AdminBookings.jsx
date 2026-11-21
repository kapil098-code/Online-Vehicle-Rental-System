import { useEffect, useState } from 'react';
import api, { errMsg, money } from '../../api.js';

const STATUSES = ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'];

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [f, setF] = useState({ status: '', from: '', to: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });

    const load = async () => {
        const params = {};
        Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
        try { setBookings((await api.get('/admin/bookings', { params })).data.bookings); }
        catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    };
    useEffect(() => { load(); }, [f]);

    const change = async (id, status) => {
        try { const { data } = await api.put(`/admin/bookings/${id}/status`, { status }); setMsg({ type: 'success', text: data.message }); }
        catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
        load();
    };

    return (
        <>
            <h1>All bookings</h1>
            <div className="card filter-bar">
                <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                    <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <label>From <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
                <label>To <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
            </div>
            {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}
            <div className="table-wrap">
                <table>
                    <thead><tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                    <tbody>
                        {bookings.map((b) => (
                            <tr key={b.booking_id}>
                                <td>{b.booking_id}</td>
                                <td>{b.customer_name}<br /><small className="muted">{b.customer_email}</small></td>
                                <td>{b.vehicle_name} <small className="muted">{b.model}</small></td>
                                <td>{b.start_date} → {b.end_date}</td>
                                <td>{money(b.total_cost)}</td>
                                <td>{b.payment_status || '—'}</td>
                                <td>
                                    <select value={b.booking_status} onChange={(e) => change(b.booking_id, e.target.value)}>
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {bookings.length === 0 && <p className="alert">No bookings found.</p>}
        </>
    );
}
