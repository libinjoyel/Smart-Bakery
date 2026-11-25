const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config();

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL_POOLED or DATABASE_URL must be configured.');
}

const pool = new Pool({ connectionString, max: 10 });

async function testConnection() {
  const { rows } = await pool.query('SELECT 1 AS connected');
  return rows[0].connected === 1;
}

module.exports = { pool, testConnection };