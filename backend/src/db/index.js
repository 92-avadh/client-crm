const { Pool, types } = require('pg');
require('dotenv').config();

// PostgreSQL DATE (OID 1082) parsed as 'YYYY-MM-DD' string to prevent UTC date shifting
types.setTypeParser(1082, (val) => val);

const dbUrl = process.env.DATABASE_URL || '';
const isInternalRender = dbUrl.includes('dpg-') && !dbUrl.includes('.render.com');
const requiresSsl = (dbUrl.includes('sslmode=require') || dbUrl.includes('.render.com') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase.co')) && process.env.DATABASE_SSL !== 'false';

// Render internal network (dpg-... without .render.com) does not support SSL.
// External cloud URLs (.render.com / neon / supabase) require SSL.
const sslConfig = isInternalRender
  ? false
  : (requiresSsl || (process.env.NODE_ENV === 'production' && !isInternalRender && process.env.DATABASE_SSL !== 'false'))
    ? { rejectUnauthorized: false }
    : false;

let pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Test connection with retry — handles slow DB startup in Docker/Render
async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected');
      client.release();
      return;
    } catch (err) {
      console.log(`⏳ DB connection attempt ${i}/${retries} failed: ${err.message}`);

      // If SSL caused the error, toggle SSL mode and retry
      if (i === 1 && err.message && (err.message.includes('SSL') || err.message.includes('encryption'))) {
        console.log('🔄 Toggling SSL configuration for PostgreSQL...');
        try {
          await pool.end().catch(() => {});
          pool = new Pool({
            connectionString: dbUrl,
            ssl: sslConfig ? false : { rejectUnauthorized: false }
          });
        } catch (_) {}
      }

      if (i === retries) throw new Error('Could not connect to PostgreSQL after ' + retries + ' attempts: ' + err.message);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = pool;
module.exports.connectWithRetry = connectWithRetry;
