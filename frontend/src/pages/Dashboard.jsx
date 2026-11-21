import { useEffect, useState } from 'react';
import api, { errMsg, money } from '../api.js';
import VerificationBox from '../components/VerificationBox.jsx';

export default function Dashboard() {
    const [bookings, setBookings] = useState([]);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [method, setMethod] = useState('Simulated Online');
    const [me, setMe] = useState(null);

    const loadMe = () => api.get('/auth/me').then((r) => setMe(r.data.user)).catch(() => {});
    useEffect(() => { loadMe(); }, []);

    const load = async () => {
        try { setBookings((await api.get('/bookings/my')).data.bookings); }
        catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    };
    useEffect(() => { load(); }, []);

    const act = async (fn) => {
        try { const { data } = await fn(); setMsg({ type: 'success', text: data.message }); }
        catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
        load();
    };
    const cancel = (id) => window.confirm('Cancel this booking?') && act(() => api.put(`/bookings/${id}/cancel`));
    const pay = (id) => act(() => api.post('/payments', { booking_id: id, payment_method: method }));

    return (
        <>
            <h1>My bookings</h1>
            <VerificationBox me={me} onChanged={loadMe} />
            {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}
            {bookings.length === 0 ? <p className="alert">You have no bookings yet.</p> : (
                <div className="table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.booking_id}>
                                    <td>{b.booking_id}</td>
                                    <td>{b.vehicle_name} <small className="muted">{b.model}</small></td>
                                    <td>{b.start_date} → {b.end_date}</td>
                                    <td>{money(b.total_cost)}</td>
                                    <td><span className={`badge s-${b.booking_status}`}>{b.booking_status}</span></td>
                                    <td>{b.payment_status ? `${b.payment_status} (${b.payment_method})` : '—'}</td>
                                    <td className="actions">
                                        {b.booking_status === 'Pending' && !b.payment_status && (
                                            <>
                                                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                                                    <option>Simulated Online</option><option>Cash on Pickup</option>
                                                </select>
                                                <button className="btn sm" onClick={() => pay(b.booking_id)}>Pay</button>
                                            </>
                                        )}
                                        {['Pending', 'Confirmed'].includes(b.booking_status) && (
                                            <button className="btn btn-danger sm" onClick={() => cancel(b.booking_id)}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
