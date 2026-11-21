import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { errMsg, money, daysBetween, todayLocal } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function VehicleDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [booked, setBooked] = useState([]);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [booking, setBooking] = useState(null); // created (Pending) booking
    const [method, setMethod] = useState('Simulated Online');
    const [msg, setMsg] = useState({ type: '', text: '' });
    const today = todayLocal();

    const load = async () => {
        try {
            const { data } = await api.get(`/vehicles/${id}`);
            setVehicle(data.vehicle);
            setBooked(data.bookedRanges);
        } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    };
    useEffect(() => { load(); }, [id]);

    if (!vehicle) return <p className={msg.type ? 'alert error' : ''}>{msg.text || 'Loading…'}</p>;

    const days = start && end && end > start ? daysBetween(start, end) : 0;
    const estimate = days * Number(vehicle.price_per_day);

    const book = async () => {
        if (!user) return navigate('/login');
        setMsg({ type: '', text: '' });
        try {
            const { data } = await api.post('/bookings', { vehicle_id: vehicle.vehicle_id, start_date: start, end_date: end });
            setBooking(data.booking);
            setMsg({ type: 'success', text: data.message });
            load();
        } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    };

    const pay = async () => {
        try {
            const { data } = await api.post('/payments', { booking_id: booking.booking_id, payment_method: method });
            setMsg({ type: 'success', text: data.message });
            setTimeout(() => navigate('/dashboard'), 1200);
        } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    };

    return (
        <div className="detail">
            <div className="card vehicle-img big">
                {vehicle.image_url ? <img src={vehicle.image_url} alt={vehicle.name} /> : <span>🚘</span>}
            </div>
            <div>
                <h1>{vehicle.name} <small className="muted">{vehicle.model}</small></h1>
                <table className="specs"><tbody>
                    <tr><td>Category</td><td>{vehicle.category}</td></tr>
                    <tr><td>Transmission</td><td>{vehicle.transmission_type}</td></tr>
                    <tr><td>Fuel</td><td>{vehicle.fuel_type}</td></tr>
                    <tr><td>Location</td><td>{vehicle.location}</td></tr>
                    <tr><td>Rate</td><td><strong>{money(vehicle.price_per_day)}</strong> / day</td></tr>
                    <tr><td>Status</td><td>{vehicle.status}</td></tr>
                </tbody></table>

                {booked.length > 0 && (
                    <div className="alert">
                        <strong>Already booked:</strong>
                        <ul>{booked.map((b, i) => <li key={i}>{b.start_date} → {b.end_date}</li>)}</ul>
                    </div>
                )}

                {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}

                {!booking ? (
                    <div className="card pad">
                        <h3>Book this vehicle</h3>
                        <div className="row">
                            <label>Pickup <input type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} /></label>
                            <label>Return <input type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
                        </div>
                        {days > 0 && <p>{days} day(s) × {money(vehicle.price_per_day)} = <strong>{money(estimate)}</strong></p>}
                        <button className="btn full" disabled={!days || vehicle.status === 'Under Maintenance'} onClick={book}>
                            {user ? 'Book now' : 'Login to book'}
                        </button>
                    </div>
                ) : (
                    <div className="card pad">
                        <h3>Complete payment</h3>
                        <p>Booking #{booking.booking_id} · {booking.days} day(s) · <strong>{money(booking.total_cost)}</strong></p>
                        <select value={method} onChange={(e) => setMethod(e.target.value)}>
                            <option>Simulated Online</option>
                            <option>Cash on Pickup</option>
                        </select>
                        <button className="btn full" onClick={pay}>Confirm booking</button>
                    </div>
                )}
            </div>
        </div>
    );
}
