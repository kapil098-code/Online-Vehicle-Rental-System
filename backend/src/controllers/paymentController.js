const pool = require('../config/db');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const HttpError = require('../utils/httpError');

const METHODS = ['Cash on Pickup', 'Simulated Online'];

// Payment placeholder: amount always comes from the booking, never from the client.
exports.makePayment = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const { booking_id, payment_method } = req.body;
        if (!booking_id || !METHODS.includes(payment_method)) {
            throw new HttpError(400, `booking_id and payment_method (${METHODS.join(' / ')}) are required.`);
        }
        await conn.beginTransaction();
        const booking = await Booking.findById(booking_id, conn);
        if (!booking || booking.user_id !== req.user.id) throw new HttpError(404, 'Booking not found.');
        if (booking.booking_status !== 'Pending') throw new HttpError(400, 'Only a Pending booking can be paid for.');
        if (await Payment.findByBooking(booking_id, conn)) throw new HttpError(409, 'Payment already recorded for this booking.');

        const online = payment_method === 'Simulated Online';
        const transactionId = online ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` : null;
        await Payment.create(conn, {
            bookingId: booking_id, amount: booking.total_cost, method: payment_method,
            status: online ? 'Paid' : 'Pending', transactionId
        });
        await Booking.updateStatus(conn, booking_id, 'Confirmed');
        await conn.commit();
        res.status(201).json({
            success: true,
            message: online ? 'Payment successful. Booking confirmed.' : 'Booking confirmed. Pay in cash at pickup.',
            transaction_id: transactionId
        });
    } catch (e) {
        await conn.rollback();
        next(e);
    } finally { conn.release(); }
};
