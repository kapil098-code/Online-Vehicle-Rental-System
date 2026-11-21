const pool = require('../config/db');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const HttpError = require('../utils/httpError');
const { validateRentalDates } = require('../utils/dateValidator');
const { calculateRentalCost, calculateDays } = require('../utils/costCalculator');

exports.createBooking = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const { vehicle_id, start_date, end_date } = req.body;
        if (!vehicle_id) throw new HttpError(400, 'vehicle_id is required.');
        const chk = validateRentalDates(start_date, end_date);
        if (!chk.isValid) throw new HttpError(400, chk.message);

        // Only customers whose ID has been approved by the admin can book.
        const me = await User.findById(req.user.id);
        if (!me) throw new HttpError(401, 'User not found.');
        if (me.role === 'customer' && me.verification_status !== 'Approved') {
            throw new HttpError(403, me.verification_status === 'Rejected'
                ? `Your ID was rejected${me.verification_remark ? `: ${me.verification_remark}` : ''}. Please upload it again from My Bookings.`
                : 'Your ID is still waiting for admin verification. You can book once it is approved.');
        }

        await conn.beginTransaction();
        // Lock the vehicle row so two simultaneous requests cannot both pass the availability check.
        const [rows] = await conn.execute('SELECT * FROM vehicles WHERE vehicle_id = ? AND is_active = 1 FOR UPDATE', [vehicle_id]);
        const vehicle = rows[0];
        if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
        if (vehicle.status === 'Under Maintenance') throw new HttpError(409, 'This vehicle is under maintenance.');
        if (await Booking.hasConflict(conn, vehicle_id, start_date, end_date)) {
            throw new HttpError(409, 'Vehicle is already booked for the selected dates.');
        }
        const totalCost = calculateRentalCost(start_date, end_date, vehicle.price_per_day);
        const bookingId = await Booking.create(conn, {
            userId: req.user.id, vehicleId: vehicle_id, start: start_date, end: end_date, totalCost
        });
        await conn.commit();
        res.status(201).json({
            success: true, message: 'Booking created. Complete payment to confirm it.',
            booking: { booking_id: bookingId, vehicle_id, start_date, end_date,
                       days: calculateDays(start_date, end_date), total_cost: totalCost, booking_status: 'Pending' }
        });
    } catch (e) {
        await conn.rollback();
        next(e);
    } finally { conn.release(); }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        res.json({ success: true, bookings: await Booking.findByUser(req.user.id) });
    } catch (e) { next(e); }
};

// Cancellation policy: owner only, Pending/Confirmed only, and at least 24 hours before the start date.
exports.cancelBooking = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const booking = await Booking.findById(req.params.id, conn);
        if (!booking || booking.user_id !== req.user.id) throw new HttpError(404, 'Booking not found.');
        if (!['Pending', 'Confirmed'].includes(booking.booking_status)) {
            throw new HttpError(400, `A ${booking.booking_status} booking cannot be cancelled.`);
        }
        const hoursLeft = (new Date(`${booking.start_date}T00:00:00`).getTime() - Date.now()) / 3600000;
        if (hoursLeft < 24) throw new HttpError(400, 'Bookings cannot be cancelled within 24 hours of the start date.');

        await Booking.updateStatus(conn, booking.booking_id, 'Cancelled');
        await Payment.markRefunded(conn, booking.booking_id);
        await conn.commit();
        res.json({ success: true, message: 'Booking cancelled.' });
    } catch (e) {
        await conn.rollback();
        next(e);
    } finally { conn.release(); }
};
