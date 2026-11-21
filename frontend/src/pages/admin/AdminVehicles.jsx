import { useEffect, useState } from 'react';
import api, { errMsg, money } from '../../api.js';

const BLANK = { name: '', category: 'Car', model: '', transmission_type: 'Manual', fuel_type: 'Petrol', price_per_day: '', location: '', status: 'Available' };

export default function AdminVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [form, setForm] = useState(BLANK);
    const [image, setImage] = useState(null);
    const [editId, setEditId] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const load = async () => setVehicles((await api.get('/vehicles')).data.vehicles);
    useEffect(() => { load().catch((e) => setMsg({ type: 'error', text: errMsg(e) })); }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const reset = () => { setForm(BLANK); setImage(null); setEditId(null); };

    const submit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (image) fd.append('image', image);
        try {
            const { data } = editId ? await api.put(`/admin/vehicles/${editId}`, fd) : await api.post('/admin/vehicles', fd);
            setMsg({ type: 'success', text: data.message });
            reset(); load();
        } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
    };

    const edit = (v) => {
        setEditId(v.vehicle_id);
        setForm({ name: v.name, category: v.category, model: v.model, transmission_type: v.transmission_type,
                  fuel_type: v.fuel_type, price_per_day: v.price_per_day, location: v.location, status: v.status });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const remove = async (id) => {
        if (!window.confirm('Remove this vehicle?')) return;
        try { const { data } = await api.delete(`/admin/vehicles/${id}`); setMsg({ type: 'success', text: data.message }); load(); }
        catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
    };

    return (
        <>
            <h1>Fleet management</h1>
            {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}
            <form className="card pad form-grid" onSubmit={submit}>
                <h3 className="span">{editId ? `Edit vehicle #${editId}` : 'Add vehicle'}</h3>
                <input placeholder="Name" required value={form.name} onChange={set('name')} />
                <input placeholder="Model / year" required value={form.model} onChange={set('model')} />
                <select value={form.category} onChange={set('category')}>{['Car', 'Bike', 'SUV', 'Van'].map((c) => <option key={c}>{c}</option>)}</select>
                <select value={form.transmission_type} onChange={set('transmission_type')}><option>Manual</option><option>Automatic</option></select>
                <select value={form.fuel_type} onChange={set('fuel_type')}>{['Petrol', 'Diesel', 'Electric', 'CNG'].map((c) => <option key={c}>{c}</option>)}</select>
                <input type="number" min="1" placeholder="Price per day (₹)" required value={form.price_per_day} onChange={set('price_per_day')} />
                <input placeholder="Location" required value={form.location} onChange={set('location')} />
                <select value={form.status} onChange={set('status')}><option>Available</option><option>Booked</option><option>Under Maintenance</option></select>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                <div className="row span">
                    <button className="btn">{editId ? 'Save changes' : 'Add vehicle'}</button>
                    {editId && <button type="button" className="btn btn-outline" onClick={reset}>Cancel edit</button>}
                </div>
            </form>

            <div className="table-wrap">
                <table>
                    <thead><tr><th>ID</th><th>Vehicle</th><th>Category</th><th>Rate</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {vehicles.map((v) => (
                            <tr key={v.vehicle_id}>
                                <td>{v.vehicle_id}</td><td>{v.name} <small className="muted">{v.model}</small></td>
                                <td>{v.category}</td><td>{money(v.price_per_day)}</td><td>{v.location}</td><td>{v.status}</td>
                                <td className="actions">
                                    <button className="btn sm" onClick={() => edit(v)}>Edit</button>
                                    <button className="btn btn-danger sm" onClick={() => remove(v.vehicle_id)}>Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
