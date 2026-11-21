import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money } from '../../api.js';

export default function AdminHome() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/stats').then((r) => setStats(r.data.stats)).catch((e) => setError(errMsg(e)));
    }, []);

    return (
        <>
            <h1>Admin dashboard</h1>
            <div className="row">
                <Link className="btn" to="/admin/vehicles">Manage fleet</Link>
                <Link className="btn" to="/admin/bookings">Manage bookings</Link>
                <Link className="btn" to="/admin/verifications">
                    Verify users{stats && stats.pendingVerifications > 0 ? ` (${stats.pendingVerifications} pending)` : ''}
                </Link>
            </div>
            {error && <p className="alert error">{error}</p>}
            {stats && (
                <>
                    <div className="grid stats">
                        <div className="card pad"><h2>{stats.totalCustomers}</h2><p className="muted">Customers</p></div>
                        <div className="card pad"><h2>{stats.totalVehicles}</h2><p className="muted">Vehicles</p></div>
                        <div className="card pad"><h2>{stats.totalBookings}</h2><p className="muted">Bookings</p></div>
                        <div className="card pad"><h2>{money(stats.totalRevenue)}</h2><p className="muted">Revenue (paid)</p></div>
                        <div className="card pad"><h2>{stats.mostRentedCategory || '—'}</h2><p className="muted">Most rented category</p></div>
                        <div className="card pad"><h2>{stats.pendingVerifications}</h2><p className="muted">IDs awaiting verification</p></div>
                    </div>
                    <h3>Bookings by status</h3>
                    <div className="row">
                        {stats.bookingsByStatus.map((s) => (
                            <span key={s.booking_status} className={`badge s-${s.booking_status}`}>{s.booking_status}: {s.c}</span>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
