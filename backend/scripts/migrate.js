// Usage: npm run migrate  -> adds the ID-verification columns to an EXISTING database (safe to run twice)
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    const db = process.env.DB_NAME || 'vehicle_rental_db';
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: db
    });
    try {
        const has = async (col) => {
            const [r] = await conn.query(
                "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema=? AND table_name='users' AND column_name=?", [db, col]);
            return r[0].c > 0;
        };
        const fresh = !(await has('verification_status'));
        const cols = {
            id_type: "id_type ENUM('Driving Licence','Aadhaar Card') NULL",
            id_number: 'id_number VARCHAR(30) NULL',
            id_document: 'id_document VARCHAR(255) NULL',
            verification_status: "verification_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending'",
            verification_remark: 'verification_remark VARCHAR(255) NULL'
        };
        for (const [name, ddl] of Object.entries(cols)) {
            if (!(await has(name))) { await conn.query(`ALTER TABLE users ADD COLUMN ${ddl}`); console.log('Added column:', name); }
        }
        if (fresh) {
            await conn.query("UPDATE users SET verification_status = 'Approved'"); // existing users stay usable
            console.log('Existing users marked Approved.');
        }
        console.log('Migration complete.');
    } finally { await conn.end(); }
})().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
