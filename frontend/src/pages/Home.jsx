import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { todayLocal } from '../api.js';
import VehicleCard from '../components/VehicleCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = [
    { name: 'Car', icon: '🚗', text: 'Comfortable cars for city drives and family trips.' },
    { name: 'SUV', icon: '🚙', text: 'Powerful SUVs for hills, highways and adventures.' },
    { name: 'Bike', icon: '🏍️', text: 'Bikes and scooters for quick and budget travel.' },
    { name: 'Van', icon: '🚐', text: 'Spacious vans for groups and long journeys.' }
];

const STEPS = [
    { n: '1', title: 'Search', text: 'Choose your dates and filter vehicles by type, fuel, location and price.' },
    { n: '2', title: 'Book', text: 'Pick a vehicle, see the exact cost instantly and confirm your booking.' },
    { n: '3', title: 'Ride', text: 'Collect your vehicle on the pickup date and enjoy the trip.' }
];

const FEATURES = [
    { icon: '⚡', title: 'Real-time availability', text: 'You only see vehicles that are actually free for your dates.' },
    { icon: '💰', title: 'Transparent pricing', text: 'Total cost = days × daily rate. No hidden charges.' },
    { icon: '🔒', title: 'Secure accounts', text: 'Passwords are hashed and every request is verified.' },
    { icon: '↩️', title: 'Easy cancellation', text: 'Cancel upcoming bookings from your dashboard.' }
];

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const today = todayLocal();
    const [vehicles, setVehicles] = useState([]);
    const [q, setQ] = useState({ category: '', location: '', startDate: '', endDate: '' });

    useEffect(() => {
        api.get('/vehicles').then((r) => setVehicles(r.data.vehicles)).catch(() => {});
    }, []);

    const search = (e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (q.category) p.set('category', q.category);
        if (q.location) p.set('location', q.location);
        if (q.startDate && q.endDate) { p.set('startDate', q.startDate); p.set('endDate', q.endDate); }
        navigate(`/vehicles?${p.toString()}`);
    };

    const locations = new Set(vehicles.map((v) => v.location)).size;

    return (
        <>
            <section className="hero">
                <h1>Rent the right vehicle,<br />anytime, anywhere.</h1>
                <p>Browse cars, SUVs, bikes and vans, check live availability and book in minutes. No queues, no paperwork.</p>
                <div className="row hero-cta">
                    <Link className="btn btn-light" to="/vehicles">Browse vehicles</Link>
                    {!user && <Link className="btn btn-ghost" to="/register">Create free account</Link>}
                </div>

                <form className="hero-search" onSubmit={search}>
                    <label>Type
                        <select value={q.category} onChange={(e) => setQ({ ...q, category: e.target.value })}>
                            <option value="">Any</option>
                            {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
                        </select>
                    </label>
                    <label>Location
                        <input placeholder="e.g. Shimla" value={q.location} onChange={(e) => setQ({ ...q, location: e.target.value })} />
                    </label>
                    <label>Pickup
                        <input type="date" min={today} value={q.startDate} onChange={(e) => setQ({ ...q, startDate: e.target.value })} />
                    </label>
                    <label>Return
                        <input type="date" min={q.startDate || today} value={q.endDate} onChange={(e) => setQ({ ...q, endDate: e.target.value })} />
                    </label>
                    <button className="btn">Search</button>
                </form>
            </section>

            {vehicles.length > 0 && (
                <section className="stat-strip">
                    <div><strong>{vehicles.length}</strong><span>Vehicles</span></div>
                    <div><strong>{CATEGORIES.length}</strong><span>Categories</span></div>
                    <div><strong>{locations}</strong><span>Locations</span></div>
                    <div><strong>24/7</strong><span>Online booking</span></div>
                </section>
            )}

            <section className="section">
                <h2>Choose your category</h2>
                <div className="grid">
                    {CATEGORIES.map((c) => (
                        <Link key={c.name} to={`/vehicles?category=${c.name}`} className="card pad cat-card">
                            <span className="cat-icon">{c.icon}</span>
                            <h3>{c.name}</h3>
                            <p className="muted">{c.text}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {vehicles.length > 0 && (
                <section className="section">
                    <div className="row between"><h2>Featured vehicles</h2><Link to="/vehicles">View all →</Link></div>
                    <div className="grid">{vehicles.slice(0, 4).map((v) => <VehicleCard key={v.vehicle_id} v={v} />)}</div>
                </section>
            )}

            <section className="section">
                <h2>How it works</h2>
                <div className="grid">
                    {STEPS.map((s) => (
                        <div key={s.n} className="card pad step">
                            <span className="step-no">{s.n}</span>
                            <h3>{s.title}</h3>
                            <p className="muted">{s.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section">
                <h2>Why choose RentRide</h2>
                <div className="grid">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="card pad">
                            <span className="cat-icon">{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p className="muted">{f.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="cta">
                <h2>Ready for your next trip?</h2>
                <p>Find a vehicle that is free for your dates and book it in a few clicks.</p>
                <Link className="btn btn-light" to="/vehicles">Find a vehicle</Link>
            </section>
        </>
    );
}
