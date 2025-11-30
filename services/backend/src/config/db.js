const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const { logDatabaseEvent } = require('../utils/securityLogger');

dotenv.config({ path: "../../../.env" });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on Postgres client', err);
    // Log critical database error
    logDatabaseEvent('connection_error', err);
    process.exit(-1);
});

const testDBConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Database connected:', res.rows[0].now);
    } catch (error) {
        console.error('Database connection error:', error);
        // Log database connection failure
        logDatabaseEvent('connection_failed', error);
    }
};

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executed:', { text, duration, rows: res.rowCount });

        // Log slow queries (> 1 segundo)
        if (duration > 1000) {
            logDatabaseEvent('slow_query', null, text, { duration });
        }

        return res;
    } catch (err) {
        console.error('Error executing query:', { text, err });
        // Log query execution error
        logDatabaseEvent('query_error', err, text);
        throw err;
    }
};

module.exports = {
    testDBConnection,
    query
};