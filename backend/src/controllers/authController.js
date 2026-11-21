const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const HttpError = require('../utils/httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_TYPES = ['Driving Licence', 'Aadhaar Card'];
const DOC_DIR = path.join(__dirname, '../../private_uploads/documents');
const sign = (u) => jwt.sign({ id: u.user_id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
const dropFile = (file) => { if (file) fs.unlink(file.path, () => {}); };

// Validates the ID type/number. Aadhaar is stored masked (only the last 4 digits) for privacy.
const checkId = (type, number) => {
    if (!ID_TYPES.includes(type)) throw new HttpError(400, `ID type must be one of: ${ID_TYPES.join(', ')}.`);
    const n = String(number || '').replace(/[\s-]/g, '').toUpperCase();
    if (type === 'Aadhaar Card') {
        if (!/^\d{12}$/.test(n)) throw new HttpError(400, 'Aadhaar number must be exactly 12 digits.');
        return `XXXXXXXX${n.slice(-4)}`;
    }
    if (!/^[A-Z0-9]{8,20}$/.test(n)) throw new HttpError(400, 'Driving licence number must be 8 to 20 letters/digits.');
    return n;
};

const userPayload = (u) => ({
    user_id: u.user_id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    verification_status: u.verification_status, verification_remark: u.verification_remark
});

exports.register = async (req, res, next) => {
    try {
        const { name, email, phone, password, id_type, id_number } = req.body; // role is NEVER taken from the request
        if (!name || !email || !phone || !password) throw new HttpError(400, 'Name, email, phone and password are required.');
        if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Invalid email address.');
        if (!/^\d{10,15}$/.test(String(phone))) throw new HttpError(400, 'Phone must be 10 to 15 digits.');
        if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
        if (!req.file) throw new HttpError(400, 'Please upload a photo of your Driving Licence or Aadhaar Card.');
        const idNumber = checkId(id_type, id_number);
        if (await User.findByEmail(String(email).trim().toLowerCase())) throw new HttpError(409, 'Email is already registered.');

        const passwordHash = await bcrypt.hash(password, 10);
        const id = await User.create({
            name: name.trim(), email: email.trim().toLowerCase(), phone, passwordHash,
            idType: id_type, idNumber, idDocument: req.file.filename
        });
        res.status(201).json({
            success: true, userId: id,
            message: 'Registration successful. Your ID will be verified by the admin before you can book.'
        });
    } catch (e) { dropFile(req.file); next(e); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new HttpError(400, 'Email and password are required.');
        const user = await User.findByEmail(String(email).trim().toLowerCase());
        if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new HttpError(401, 'Invalid email or password.');
        res.json({ success: true, token: sign(user), user: userPayload(user) });
    } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) throw new HttpError(404, 'User not found.');
        res.json({ success: true, user });
    } catch (e) { next(e); }
};

// A customer whose ID was Rejected can upload a corrected document.
exports.resubmitDocument = async (req, res, next) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me || me.role !== 'customer') throw new HttpError(403, 'Only customers can submit an ID.');
        if (me.verification_status !== 'Rejected') throw new HttpError(400, 'You can resubmit only after your ID was rejected.');
        if (!req.file) throw new HttpError(400, 'Please upload a photo of your ID document.');
        const idNumber = checkId(req.body.id_type, req.body.id_number);

        const old = await User.getDocument(req.user.id);
        await User.resubmit(req.user.id, { idType: req.body.id_type, idNumber, idDocument: req.file.filename });
        if (old) fs.unlink(path.join(DOC_DIR, path.basename(old)), () => {});
        res.json({ success: true, message: 'Document submitted again. Waiting for admin verification.' });
    } catch (e) { dropFile(req.file); next(e); }
};
