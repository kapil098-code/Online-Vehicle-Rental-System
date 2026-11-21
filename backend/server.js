require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;

pool.getConnection()
    .then((conn) => {
        conn.release();
        console.log('Database connected successfully.');
        app.listen(PORT, () => console.log(`Vehicle Rental API running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Unable to connect to MySQL:', err.message);
        process.exit(1);
    });
