import { useState } from 'react';
import api, { errMsg } from '../api.js';

// Shows the customer's ID verification status; lets a rejected user upload a corrected document.
export default function VerificationBox({ me, onChanged }) {
    const [idType, setIdType] = useState('Driving Licence');
    const [idNumber, setIdNumber] = useState('');
    const [file, setFile] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });

    if (!me || me.role !== 'customer') return null;

    if (me.verification_status === 'Approved') {
        return <p className="alert success">✅ Your ID ({me.id_type || 'document'}) is verified. You can book vehicles.</p>;
    }
    if (me.verification_status === 'Pending') {
        return <p className="alert">⏳ Your ID is waiting for admin verification. You can book as soon as it is approved.</p>;
    }

    const submit = async (e) => {
        e.preventDefault();
        if (!file) return setMsg({ type: 'error', text: 'Please choose a photo of your ID.' });
        const fd = new FormData();
        fd.append('id_type', idType);
        fd.append('id_number', idNumber);
        fd.append('id_document', file);
        try {
            const { data } = await api.put('/auth/documents', fd);
            setMsg({ type: 'success', text: data.message });
            onChanged();
        } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
    };

    return (
        <form className="card pad" onSubmit={submit}>
            <p className="alert error">❌ Your ID was rejected{me.verification_remark ? `: ${me.verification_remark}` : '.'} Please upload it again.</p>
            {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}
            <div className="row">
                <select value={idType} onChange={(e) => setIdType(e.target.value)}>
                    <option>Driving Licence</option><option>Aadhaar Card</option>
                </select>
                <input placeholder="ID number" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setFile(e.target.files[0])} />
                <button className="btn">Submit again</button>
            </div>
        </form>
    );
}
