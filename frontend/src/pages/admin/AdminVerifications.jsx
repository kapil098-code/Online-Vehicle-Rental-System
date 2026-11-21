import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api.js';

export default function AdminVerifications() {
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState('Pending');
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [preview, setPreview] = useState(null); // { url, name }

    const load = async () => {
        try { setUsers((await api.get('/admin/users', { params: status ? { status } : {} })).data.users); }
        catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    };
    useEffect(() => { load(); }, [status]);

    const view = async (u) => {
        try {
            const r = await api.get(`/admin/users/${u.user_id}/document`, { responseType: 'blob' });
            setPreview({ url: URL.createObjectURL(r.data), name: `${u.name} - ${u.id_type}` });
        } catch (e) { setMsg({ type: 'error', text: 'Could not load the document.' }); }
    };
    const closePreview = () => { URL.revokeObjectURL(preview.url); setPreview(null); };

    const decide = async (u, newStatus) => {
        let remark = '';
        if (newStatus === 'Rejected') {
            remark = window.prompt('Reason for rejection (shown to the user):', 'Photo is not clear');
            if (!remark) return;
        }
        try {
            const { data } = await api.put(`/admin/users/${u.user_id}/verification`, { status: newStatus, remark });
            setMsg({ type: 'success', text: `${u.name}: ${data.message}` });
        } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
        load();
    };

    return (
        <>
            <h1>ID verification</h1>
            <div className="card filter-bar">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All customers</option>
                    <option>Pending</option><option>Approved</option><option>Rejected</option>
                </select>
            </div>
            {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Customer</th><th>Phone</th><th>ID type</th><th>ID number</th><th>Document</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.user_id}>
                                <td>{u.name}<br /><small className="muted">{u.email}</small></td>
                                <td>{u.phone}</td>
                                <td>{u.id_type || '—'}</td>
                                <td>{u.id_number || '—'}</td>
                                <td>{u.has_document ? <button className="btn btn-outline sm" onClick={() => view(u)}>View photo</button> : '—'}</td>
                                <td>
                                    <span className={`badge v-${u.verification_status}`}>{u.verification_status}</span>
                                    {u.verification_remark && <><br /><small className="muted">{u.verification_remark}</small></>}
                                </td>
                                <td className="actions">
                                    {u.verification_status !== 'Approved' && <button className="btn sm" onClick={() => decide(u, 'Approved')}>Approve</button>}
                                    {u.verification_status !== 'Rejected' && <button className="btn btn-danger sm" onClick={() => decide(u, 'Rejected')}>Reject</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && <p className="alert">No customers found.</p>}

            {preview && (
                <div className="overlay" onClick={closePreview}>
                    <div className="overlay-box" onClick={(e) => e.stopPropagation()}>
                        <div className="row between"><strong>{preview.name}</strong><button className="btn sm" onClick={closePreview}>Close</button></div>
                        <img src={preview.url} alt="ID document" />
                    </div>
                </div>
            )}
        </>
    );
}
