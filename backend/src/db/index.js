const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const hasSslInUrl = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('supabase.co'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (isProduction || hasSslInUrl) && process.env.DATABASE_SSL !== 'false'
    ? { rejectUnauthorized: false }
    : false
});

// Test connection with retry — handles slow DB startup in Docker
async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected');
      client.release();
      return;
    } catch (err) {
      console.log(`⏳ DB not ready (attempt ${i}/${retries}), retrying in ${delay/1000}s...`);
      if (i === retries) throw new Error('Could not connect to PostgreSQL after ' + retries + ' attempts');
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = pool;
module.exports.connectWithRetry = connectWithRetry;
