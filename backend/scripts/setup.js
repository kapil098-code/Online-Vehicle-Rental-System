// Usage: npm run setup   -> creates the database + tables and inserts demo data (only if empty)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true
    });
    try {
        await conn.query(fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8'));
        await conn.query('USE vehicle_rental_db');
        console.log('Tables ready.');

        const [[{ c }]] = await conn.query('SELECT COUNT(*) AS c FROM users');
        if (c > 0) { console.log('Data already present - seed skipped.'); return; }

        const adminHash = await bcrypt.hash('Admin@123', 10);
        const custHash = await bcrypt.hash('Customer@123', 10);
        await conn.query(
            "INSERT INTO users (name, email, phone, password_hash, role, verification_status) VALUES (?,?,?,?,?,'Approved'),(?,?,?,?,?,'Approved')",
            ['Admin', 'admin@rental.com', '9876500001', adminHash, 'admin',
             'Demo Customer', 'customer@rental.com', '9876500002', custHash, 'customer']
        );
        const vehicles = [
            ['Swift Dzire', 'Car', '2023', 'Manual', 'Petrol', 1800, 'Shimla'],
            ['Hyundai i20', 'Car', '2024', 'Automatic', 'Petrol', 2200, 'Shimla'],
            ['Mahindra Thar', 'SUV', '2023', 'Manual', 'Diesel', 3500, 'Manali'],
            ['Toyota Fortuner', 'SUV', '2022', 'Automatic', 'Diesel', 5500, 'Chandigarh'],
            ['Royal Enfield Classic 350', 'Bike', '2023', 'Manual', 'Petrol', 900, 'Manali'],
            ['Honda Activa', 'Bike', '2024', 'Automatic', 'Petrol', 500, 'Shimla'],
            ['Tata Nexon EV', 'Car', '2024', 'Automatic', 'Electric', 2800, 'Chandigarh'],
            ['Force Traveller', 'Van', '2021', 'Manual', 'Diesel', 4800, 'Dharamshala']
        ];
        for (const v of vehicles) {
            await conn.query(
                'INSERT INTO vehicles (name, category, model, transmission_type, fuel_type, price_per_day, location) VALUES (?,?,?,?,?,?,?)', v
            );
        }
        console.log('Demo data inserted.');
        console.log('  Admin    : admin@rental.com    / Admin@123');
        console.log('  Customer : customer@rental.com / Customer@123');
    } finally {
        await conn.end();
    }
})().catch((e) => { console.error('Setup failed:', e.message); process.exit(1); });
