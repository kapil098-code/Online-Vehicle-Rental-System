const pool = require('../config/db');

const ACTIVE = "('Pending','Confirmed','Ongoing')";

const Vehicle = {
    // Search + filter. If startDate/endDate are given, only vehicles free for that whole period are returned.
    async search(f = {}) {
        const where = ['v.is_active = 1'];
        const params = [];
        if (f.category)     { where.push('v.category = ?');          params.push(f.category); }
        if (f.transmission) { where.push('v.transmission_type = ?'); params.push(f.transmission); }
        if (f.fuel)         { where.push('v.fuel_type = ?');         params.push(f.fuel); }
        if (f.location)     { where.push('v.location LIKE ?');       params.push(`%${f.location}%`); }
        if (f.minPrice)     { where.push('v.price_per_day >= ?');    params.push(Number(f.minPrice)); }
        if (f.maxPrice)     { where.push('v.price_per_day <= ?');    params.push(Number(f.maxPrice)); }
        if (f.q)            { where.push('(v.name LIKE ? OR v.model LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }
        if (f.startDate && f.endDate) {
            where.push("v.status <> 'Under Maintenance'");
            where.push(`NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id = v.vehicle_id
                         AND b.booking_status IN ${ACTIVE} AND b.start_date < ? AND b.end_date > ?)`);
            params.push(f.endDate, f.startDate);
        }
        const [rows] = await pool.execute(
            `SELECT v.* FROM vehicles v WHERE ${where.join(' AND ')} ORDER BY v.created_at DESC, v.vehicle_id DESC`, params
        );
        return rows;
    },
    async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM vehicles WHERE vehicle_id = ? AND is_active = 1', [id]);
        return rows[0];
    },
    // Booked date ranges of a vehicle (used to show unavailable periods on the detail page)
    async bookedRanges(id) {
        const [rows] = await pool.execute(
            `SELECT start_date, end_date FROM bookings WHERE vehicle_id = ? AND booking_status IN ${ACTIVE}
             AND end_date >= CURDATE() ORDER BY start_date`, [id]
        );
        return rows;
    },
    async create(v) {
        const [r] = await pool.execute(
            `INSERT INTO vehicles (name, category, model, transmission_type, fuel_type, price_per_day, location, status, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [v.name, v.category, v.model, v.transmission_type, v.fuel_type, v.price_per_day, v.location, v.status, v.image_url || null]
        );
        return r.insertId;
    },
    async update(id, v) {
        await pool.execute(
            `UPDATE vehicles SET name=?, category=?, model=?, transmission_type=?, fuel_type=?, price_per_day=?,
             location=?, status=?, image_url=COALESCE(?, image_url) WHERE vehicle_id=? AND is_active=1`,
            [v.name, v.category, v.model, v.transmission_type, v.fuel_type, v.price_per_day, v.location, v.status, v.image_url || null, id]
        );
    },
    async hasActiveBookings(id) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM bookings WHERE vehicle_id = ? AND booking_status IN ${ACTIVE}`, [id]
        );
        return rows[0].c > 0;
    },
    async softDelete(id) {
        await pool.execute('UPDATE vehicles SET is_active = 0 WHERE vehicle_id = ?', [id]);
    },
    async setStatus(conn, id, status) {
        await conn.execute('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', [status, id]);
    }
};
module.exports = Vehicle;
