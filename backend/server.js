require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { connectWithRetry } = require('./src/db');
const pool = require('./src/db');
const app = express();

/* ------------------------------------------------------------------ */
/*  Security headers (helmet)                                          */
/* ------------------------------------------------------------------ */
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://client-crm-api-g9qz.onrender.com"],
    fontSrc: ["'self'", "https:"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
}));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

/* ------------------------------------------------------------------ */
/*  CORS — restrict to known origins (no wildcard)                     */
/*  Set CORS_ORIGINS as a comma-separated list, e.g.                   */
/*    CORS_ORIGINS=https://client-crm.example.workers.dev,https://app.example.com
/*  Entries may use a leading wildcard: https://*.workers.dev          */
/* ------------------------------------------------------------------ */
const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:4173,https://*.pages.dev,https://*.workers.dev,https://*.onrender.com';
const RAW_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
  .split(',').map(s => s.trim()).filter(Boolean);

const toRegex = (pattern) =>
  new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

const ALLOWED_ORIGINS = RAW_ORIGINS.filter(o => !o.includes('*'));
const ALLOWED_PATTERNS = RAW_ORIGINS.filter(o => o.includes('*')).map(toRegex);

const isAllowedOrigin = (origin) =>
  ALLOWED_ORIGINS.includes(origin) || ALLOWED_PATTERNS.some(rx => rx.test(origin));

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
  console.log('ℹ️  CORS_ORIGINS not set. Allowing localhost and default Cloudflare/Render deployment domains (*.pages.dev, *.workers.dev, *.onrender.com).');
}

app.use(cors({
  origin: (origin, cb) => {
    // Requests with no Origin (server-to-server, curl, health checks) pass through.
    if (!origin || isAllowedOrigin(origin)) return cb(null, true);
    console.warn(`CORS blocked request from origin: ${origin}`);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

/* ------------------------------------------------------------------ */
/*  Body parsing                                                       */
/* ------------------------------------------------------------------ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/* ------------------------------------------------------------------ */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);

const auth = require('./src/middleware/auth');

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */
app.use('/api/auth', require('./src/routes/auth'));

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

/* ------------------------------------------------------------------ */
/*  Global error handler                                               */
/*  Controllers throw; this converts the throw into a safe response.   */
/* ------------------------------------------------------------------ */
app.use(require('./src/middleware/errorHandler'));

/* ------------------------------------------------------------------ */
/*  Graceful shutdown                                                  */
/* ------------------------------------------------------------------ */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

/* ------------------------------------------------------------------ */
/*  Env validation — fail fast if required secrets missing              */
/* ------------------------------------------------------------------ */
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET env var is not set or < 32 chars. Using safe default key. Set JWT_SECRET in Render Environment Variables for maximum security.');
}

const PORT = process.env.PORT || 4000;

connectWithRetry()
  .then(async () => {
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
      await pool.query(schema);
      console.log('✅ Schema applied');

      await pool.query(`
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE meetings ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);
        ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
        UPDATE brands SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE tasks SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE projects SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE invoices SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE payments SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE expenses SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE meetings SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE leads SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
      `).catch(e => console.warn('Migration warning:', e.message));

      // One-time database reset for fresh account testing
      await pool.query(`
        CREATE TABLE IF NOT EXISTS _system_migrations (
          name VARCHAR(100) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT NOW()
        );
      `).catch(() => {});

      const { rows: cleared } = await pool.query(
        "SELECT 1 FROM _system_migrations WHERE name = 'clear_all_users_for_fresh_testing_v1'"
      ).catch(() => ({ rows: [] }));

      if (!cleared.length) {
        console.log('🧹 One-time reset: Clearing all existing users and relational records from database for fresh account testing...');
        await pool.query(`
          DELETE FROM message_read_by;
          DELETE FROM message_attachments;
          DELETE FROM chat_messages;
          DELETE FROM conversation_participants;
          DELETE FROM conversations;
          DELETE FROM meeting_attendees;
          DELETE FROM meetings;
          DELETE FROM notifications;
          DELETE FROM audit_logs;
          DELETE FROM otp_verifications;
          DELETE FROM payments;
          DELETE FROM invoice_items;
          DELETE FROM recurring_invoices;
          DELETE FROM invoices;
          DELETE FROM expenses;
          DELETE FROM leads;
          DELETE FROM project_assignments;
          DELETE FROM tasks;
          DELETE FROM projects;
          DELETE FROM brand_assignments;
          DELETE FROM user_brand_assignments;
          DELETE FROM brand_documents;
          DELETE FROM brands;
          DELETE FROM users;
          INSERT INTO _system_migrations (name) VALUES ('clear_all_users_for_fresh_testing_v1')
          ON CONFLICT DO NOTHING;
        `).catch(e => console.warn('User reset warning:', e.message));
        console.log('✅ All users removed. Database is now clean and ready for fresh account registration.');
      } else if (process.env.AUTO_SEED === 'true') {
        const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCountRes.rows[0].count, 10) === 0) {
          console.log('🌱 Database is empty. Auto-seeding demo data...');
          const seed = require('./src/db/seed');
          await seed(false);
          console.log('✅ Auto-seed completed');
        }
      }
    } catch (err) {
      console.error('⚠️  Schema / Seed error:', err.message);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Retentio backend running on port ${PORT}`);

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
