require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { connectWithRetry } = require('./src/db');
const pool = require('./src/db');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const auth = require('./src/middleware/auth');

// Public routes
app.use('/api/auth', require('./src/routes/auth'));

// Protected routes
app.use('/api/users', auth, require('./src/routes/users'));
app.use('/api/brands', auth, require('./src/routes/brands'));
app.use('/api/projects', auth, require('./src/routes/projects'));
app.use('/api/tasks', auth, require('./src/routes/tasks'));
app.use('/api/invoices', auth, require('./src/routes/invoices'));
app.use('/api/payments', auth, require('./src/routes/payments'));
app.use('/api/expenses', auth, require('./src/routes/expenses'));
app.use('/api/meetings', auth, require('./src/routes/meetings'));
app.use('/api/leads', auth, require('./src/routes/leads'));
app.use('/api/notifications', auth, require('./src/routes/notifications'));
app.use('/api/chat', auth, require('./src/routes/chat'));
app.use('/api/settings', auth, require('./src/routes/settings'));
app.use('/api/holidays', auth, require('./src/routes/holidays'));
app.use('/api/audit-logs', auth, require('./src/routes/auditLogs'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;

// Connect to DB, auto-apply schema, then start server
connectWithRetry()
  .then(async () => {
    // Auto-apply schema on every startup (CREATE TABLE IF NOT EXISTS is safe)
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
      await pool.query(schema);
      console.log('✅ Schema applied');

      // Check if users exist; if not, auto-seed initial demo data
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0) {
        console.log('🌱 Database is empty. Auto-seeding demo data...');
        const seed = require('./src/db/seed');
        await seed(false);
        console.log('✅ Auto-seed completed');
      }
    } catch (err) {
      console.error('⚠️  Schema / Seed error:', err.message);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Retentio backend running on port ${PORT}`);

      // Keep-alive self-pinger for Render Free Tier (pings every 13 minutes to prevent 15-minute idle sleep)
      const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || 'https://client-crm-api-g9qz.onrender.com';
      if (keepAliveUrl && !keepAliveUrl.includes('localhost')) {
        const pingIntervalMs = 13 * 60 * 1000;
        setInterval(() => {
          const healthUrl = `${keepAliveUrl.replace(/\/+$/, '')}/api/health`;
          const https = require('https');
          const http = require('http');
          const client = healthUrl.startsWith('https') ? https : http;
          client.get(healthUrl, (res) => {
            console.log(`💓 Keep-alive ping sent to ${healthUrl} (Status: ${res.statusCode})`);
          }).on('error', (e) => {
            console.log(`⚠️ Keep-alive ping failed: ${e.message}`);
          });
        }, pingIntervalMs);
        console.log(`⏰ Keep-alive pinger scheduled for ${keepAliveUrl} every 13 minutes`);
      }
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });
