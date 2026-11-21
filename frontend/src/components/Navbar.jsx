import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const out = () => { logout(); navigate('/'); };

    return (
        <nav className="navbar">
            <Link to="/" className="brand">🚗 RentRide</Link>
            <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/vehicles">Vehicles</Link>
                {user?.role === 'customer' && <Link to="/dashboard">My Bookings</Link>}
                {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
                {user ? (
                    <>
                        <span className="muted">Hi, {user.name.split(' ')[0]}</span>
                        <button className="btn btn-outline" onClick={out}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register" className="btn">Sign up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
