import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        try {
            const u = await login(form.email, form.password);
            navigate(u.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) { setError(errMsg(err)); }
    };

    return (
        <form className="card pad auth" onSubmit={submit}>
            <h2>Login</h2>
            {location.state?.msg && <p className="alert success">{location.state.msg}</p>}
            {error && <p className="alert error">{error}</p>}
            <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="btn full">Login</button>
            <p className="muted">New here? <Link to="/register">Create an account</Link></p>
        </form>
    );
}
