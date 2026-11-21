import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', id_type: 'Driving Licence', id_number: '' });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const pick = (e) => {
        const f = e.target.files[0];
        setFile(f || null);
        setPreview(f ? URL.createObjectURL(f) : '');
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!file) return setError('Please upload a photo of your ID document.');
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('id_document', file);
        try {
            await register(fd);
            navigate('/login', { state: { msg: 'Registration successful! Your ID will be verified by the admin before you can book.' } });
        } catch (err) { setError(errMsg(err)); }
    };

    return (
        <form className="card pad auth" onSubmit={submit}>
            <h2>Create account</h2>
            {error && <p className="alert error">{error}</p>}
            <input placeholder="Full name" required value={form.name} onChange={set('name')} />
            <input type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
            <input placeholder="Phone (digits only)" required value={form.phone} onChange={set('phone')} />
            <input type="password" placeholder="Password (min 6 characters)" required minLength={6} value={form.password} onChange={set('password')} />

            <h3>Identity verification</h3>
            <p className="muted small">Upload a clear photo of your Driving Licence or Aadhaar Card. It is visible only to the admin and is used only to verify you.</p>
            <select value={form.id_type} onChange={set('id_type')}>
                <option>Driving Licence</option>
                <option>Aadhaar Card</option>
            </select>
            <input
                placeholder={form.id_type === 'Aadhaar Card' ? 'Aadhaar number (12 digits)' : 'Driving licence number'}
                required value={form.id_number} onChange={set('id_number')}
            />
            <label>Photo of document (JPG / PNG / WEBP, max 5 MB)
                <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={pick} />
            </label>
            {preview && <img className="doc-preview" src={preview} alt="ID preview" />}

            <button className="btn full">Register</button>
            <p className="muted">Already registered? <Link to="/login">Login</Link></p>
        </form>
    );
}
