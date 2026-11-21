const pool = require('../config/db');

const ACTIVE = "('Pending','Confirmed','Ongoing')";

const Booking = {
    // Core rule: two bookings overlap when existing.start < new.end AND existing.end > new.start.
    // (end date is the return day, so back-to-back bookings are allowed.)
    async hasConflict(conn, vehicleId, start, end) {
        const [rows] = await conn.execute(
            `SELECT COUNT(*) AS c FROM bookings WHERE vehicle_id = ? AND booking_status IN ${ACTIVE}
             AND start_date < ? AND end_date > ?`, [vehicleId, end, start]
        );
        return rows[0].c > 0;
    },
    async create(conn, { userId, vehicleId, start, end, totalCost }) {
        const [r] = await conn.execute(
            `INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, total_cost, booking_status)
             VALUES (?, ?, ?, ?, ?, 'Pending')`, [userId, vehicleId, start, end, totalCost]
        );
        return r.insertId;
    },
    async findById(id, conn = pool) {
        const [rows] = await conn.execute('SELECT * FROM bookings WHERE booking_id = ?', [id]);
        return rows[0];
    },
    async findByUser(userId) {
        const [rows] = await pool.execute(
            `SELECT b.*, v.name AS vehicle_name, v.model, v.category, v.image_url, v.location,
                    p.payment_status, p.payment_method
             FROM bookings b JOIN vehicles v ON b.vehicle_id = v.vehicle_id
             LEFT JOIN payments p ON p.booking_id = b.booking_id
             WHERE b.user_id = ? ORDER BY b.created_at DESC, b.booking_id DESC`, [userId]
        );
        return rows;
    },
    async findAll({ status, from, to } = {}) {
        const where = ['1=1'];
        const params = [];
        if (status) { where.push('b.booking_status = ?'); params.push(status); }
        if (from)   { where.push('b.end_date >= ?');      params.push(from); }
        if (to)     { where.push('b.start_date <= ?');    params.push(to); }
        const [rows] = await pool.execute(
            `SELECT b.*, u.name AS customer_name, u.email AS customer_email, v.name AS vehicle_name, v.model,
                    p.payment_status, p.payment_method
             FROM bookings b JOIN users u ON b.user_id = u.user_id JOIN vehicles v ON b.vehicle_id = v.vehicle_id
             LEFT JOIN payments p ON p.booking_id = b.booking_id
             WHERE ${where.join(' AND ')} ORDER BY b.created_at DESC, b.booking_id DESC`, params
        );
        return rows;
    },
    async updateStatus(conn, id, status) {
        await conn.execute('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', [status, id]);
    }
};
module.exports = Booking;
