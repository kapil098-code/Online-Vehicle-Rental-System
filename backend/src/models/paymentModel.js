const pool = require('../config/db');

const Payment = {
    async create(conn, { bookingId, amount, method, status, transactionId }) {
        const [r] = await conn.execute(
            `INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id)
             VALUES (?, ?, ?, ?, ?)`, [bookingId, amount, method, status, transactionId]
        );
        return r.insertId;
    },
    async findByBooking(bookingId, conn = pool) {
        const [rows] = await conn.execute('SELECT * FROM payments WHERE booking_id = ?', [bookingId]);
        return rows[0];
    },
    async markRefunded(conn, bookingId) {
        await conn.execute("UPDATE payments SET payment_status = 'Refunded' WHERE booking_id = ? AND payment_status = 'Paid'", [bookingId]);
    }
};
module.exports = Payment;
