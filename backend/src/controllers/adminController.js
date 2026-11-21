const pool = require('../config/db');
const Vehicle = require('../models/vehicleModel');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const path = require('path');
const HttpError = require('../utils/httpError');

const CATEGORIES = ['Car', 'Bike', 'SUV', 'Van'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'CNG'];
const VEHICLE_STATUS = ['Available', 'Booked', 'Under Maintenance'];
const BOOKING_STATUS = ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'];

const readVehicle = (req) => {
    const b = req.body;
    const v = {
        name: (b.name || '').trim(), category: b.category, model: (b.model || '').trim(),
        transmission_type: b.transmission_type || 'Manual', fuel_type: b.fuel_type || 'Petrol',
        price_per_day: Number(b.price_per_day), location: (b.location || '').trim(),
        status: b.status || 'Available', image_url: req.file ? `/uploads/${req.file.filename}` : null
    };
    if (!v.name || !v.model || !v.location) throw new HttpError(400, 'Name, model and location are required.');
    if (!CATEGORIES.includes(v.category)) throw new HttpError(400, `Category must be one of: ${CATEGORIES.join(', ')}.`);
    if (!TRANSMISSIONS.includes(v.transmission_type)) throw new HttpError(400, 'Invalid transmission type.');
    if (!FUELS.includes(v.fuel_type)) throw new HttpError(400, 'Invalid fuel type.');
    if (!VEHICLE_STATUS.includes(v.status)) throw new HttpError(400, 'Invalid vehicle status.');
    if (!(v.price_per_day > 0)) throw new HttpError(400, 'Price per day must be greater than 0.');
    return v;
};

exports.addVehicle = async (req, res, next) => {
    try {
        const id = await Vehicle.create(readVehicle(req));
        res.status(201).json({ success: true, message: 'Vehicle added.', vehicle_id: id });
    } catch (e) { next(e); }
};

exports.updateVehicle = async (req, res, next) => {
    try {
        if (!(await Vehicle.findById(req.params.id))) throw new HttpError(404, 'Vehicle not found.');
        await Vehicle.update(req.params.id, readVehicle(req));
        res.json({ success: true, message: 'Vehicle updated.' });
    } catch (e) { next(e); }
};

// Soft delete: history is preserved; blocked while the vehicle has active bookings.
exports.deleteVehicle = async (req, res, next) => {
    try {
        if (!(await Vehicle.findById(req.params.id))) throw new HttpError(404, 'Vehicle not found.');
        if (await Vehicle.hasActiveBookings(req.params.id)) {
            throw new HttpError(409, 'Cannot remove a vehicle that has active bookings.');
        }
        await Vehicle.softDelete(req.params.id);
        res.json({ success: true, message: 'Vehicle removed.' });
    } catch (e) { next(e); }
};

exports.getAllBookings = async (req, res, next) => {
    try {
        res.json({ success: true, bookings: await Booking.findAll(req.query) });
    } catch (e) { next(e); }
};

exports.updateBookingStatus = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const { status } = req.body;
        if (!BOOKING_STATUS.includes(status)) throw new HttpError(400, `Status must be one of: ${BOOKING_STATUS.join(', ')}.`);
        await conn.beginTransaction();
        const booking = await Booking.findById(req.params.id, conn);
        if (!booking) throw new HttpError(404, 'Booking not found.');

        await Booking.updateStatus(conn, booking.booking_id, status);
        if (status === 'Ongoing') await Vehicle.setStatus(conn, booking.vehicle_id, 'Booked');
        if (status === 'Completed' || status === 'Cancelled') {
            await conn.execute("UPDATE vehicles SET status = 'Available' WHERE vehicle_id = ? AND status = 'Booked'", [booking.vehicle_id]);
        }
        if (status === 'Cancelled') await Payment.markRefunded(conn, booking.booking_id);
        await conn.commit();
        res.json({ success: true, message: `Booking marked ${status}.` });
    } catch (e) {
        await conn.rollback();
        next(e);
    } finally { conn.release(); }
};

exports.getStats = async (req, res, next) => {
    try {
        const one = async (sql) => (await pool.execute(sql))[0];
        const [[u], [v], [b], [r], byStatus, top, [pv]] = await Promise.all([
            one("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'"),
            one('SELECT COUNT(*) AS c FROM vehicles WHERE is_active = 1'),
            one('SELECT COUNT(*) AS c FROM bookings'),
            one("SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE payment_status = 'Paid'"),
            one('SELECT booking_status, COUNT(*) AS c FROM bookings GROUP BY booking_status'),
            one(`SELECT v.category, COUNT(*) AS c FROM bookings b JOIN vehicles v ON b.vehicle_id = v.vehicle_id
                 WHERE b.booking_status <> 'Cancelled' GROUP BY v.category ORDER BY c DESC LIMIT 1`),
            one("SELECT COUNT(*) AS c FROM users WHERE role = 'customer' AND verification_status = 'Pending'")
        ]);
        res.json({
            success: true,
            stats: {
                totalCustomers: u.c, totalVehicles: v.c, totalBookings: b.c, totalRevenue: Number(r.s), pendingVerifications: pv.c,
                bookingsByStatus: byStatus, mostRentedCategory: top[0] ? top[0].category : null
            }
        });
    } catch (e) { next(e); }
};

// ---------- ID verification ----------
exports.listUsers = async (req, res, next) => {
    try {
        res.json({ success: true, users: await User.listCustomers(req.query.status) });
    } catch (e) { next(e); }
};

exports.getUserDocument = async (req, res, next) => {
    try {
        const file = await User.getDocument(req.params.id);
        if (!file) throw new HttpError(404, 'No document uploaded for this user.');
        const full = path.join(__dirname, '../../private_uploads/documents', path.basename(file));
        res.sendFile(full, (err) => { if (err && !res.headersSent) next(new HttpError(404, 'Document file is missing on the server.')); });
    } catch (e) { next(e); }
};

exports.setVerification = async (req, res, next) => {
    try {
        const { status, remark } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) throw new HttpError(400, 'Status must be Approved or Rejected.');
        if (status === 'Rejected' && !(remark || '').trim()) throw new HttpError(400, 'Please give a reason for rejection.');
        const n = await User.setVerification(req.params.id, status, status === 'Rejected' ? remark.trim().slice(0, 255) : null);
        if (!n) throw new HttpError(404, 'Customer not found.');
        res.json({ success: true, message: `User ${status.toLowerCase()}.` });
    } catch (e) { next(e); }
};
