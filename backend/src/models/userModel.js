const pool = require('../config/db');

const PUBLIC_COLS = 'user_id, name, email, phone, role, id_type, id_number, verification_status, verification_remark, created_at';

const User = {
    async create({ name, email, phone, passwordHash, idType, idNumber, idDocument }) {
        const [r] = await pool.execute(
            `INSERT INTO users (name, email, phone, password_hash, role, id_type, id_number, id_document, verification_status)
             VALUES (?, ?, ?, ?, 'customer', ?, ?, ?, 'Pending')`,
            [name, email, phone, passwordHash, idType, idNumber, idDocument]
        );
        return r.insertId;
    },
    async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },
    async findById(id) {
        const [rows] = await pool.execute(`SELECT ${PUBLIC_COLS} FROM users WHERE user_id = ?`, [id]);
        return rows[0];
    },
    async listCustomers(status) {
        const params = [];
        let where = "role = 'customer'";
        if (status) { where += ' AND verification_status = ?'; params.push(status); }
        const [rows] = await pool.execute(
            `SELECT ${PUBLIC_COLS}, (id_document IS NOT NULL) AS has_document FROM users WHERE ${where}
             ORDER BY FIELD(verification_status, 'Pending', 'Rejected', 'Approved'), created_at DESC`, params
        );
        return rows;
    },
    async getDocument(id) {
        const [rows] = await pool.execute('SELECT id_document FROM users WHERE user_id = ?', [id]);
        return rows[0] ? rows[0].id_document : null;
    },
    async setVerification(id, status, remark) {
        const [r] = await pool.execute(
            "UPDATE users SET verification_status = ?, verification_remark = ? WHERE user_id = ? AND role = 'customer'",
            [status, remark || null, id]
        );
        return r.affectedRows;
    },
    async resubmit(id, { idType, idNumber, idDocument }) {
        await pool.execute(
            `UPDATE users SET id_type = ?, id_number = ?, id_document = ?, verification_status = 'Pending', verification_remark = NULL
             WHERE user_id = ? AND role = 'customer'`, [idType, idNumber, idDocument, id]
        );
    }
};
module.exports = User;
