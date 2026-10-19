require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { connectWithRetry } = require('./src/db');
const pool = require('./src/db');
const { initSocket } = require('./src/socket');
const app = express();
const httpServer = http.createServer(app);

// Render runs behind a reverse proxy/load balancer — enable trust proxy for accurate client IPs & rate limiting
app.set('trust proxy', 1);

/* ------------------------------------------------------------------ */
/*  Security headers (helmet)                                          */
/* ------------------------------------------------------------------ */
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://client-crm-api-g9qz.onrender.com", "wss://client-crm-api-g9qz.onrender.com"],
    fontSrc: ["'self'", "https:"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
}));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

/* ------------------------------------------------------------------ */
/*  CORS — restrict to known origins (no wildcards in production)     */
/*  Set CORS_ORIGINS as a comma-separated list, e.g.                   */
/*    CORS_ORIGINS=https://client-crm.pages.dev,https://app.retentio.co*/
/* ------------------------------------------------------------------ */
const DEFAULT_ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? 'http://localhost:5173,http://localhost:4173,https://client-crm.pages.dev,https://client-crm.dhameliyaavadh592.workers.dev,https://*.client-crm.dhameliyaavadh592.workers.dev'
  : 'http://localhost:5173,http://localhost:4173';
const RAW_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
  .split(',').map(s => s.trim()).filter(Boolean);

const toRegex = (pattern) =>
  new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

const ALLOWED_ORIGINS = RAW_ORIGINS.filter(o => !o.includes('*'));
const ALLOWED_PATTERNS = RAW_ORIGINS.filter(o => o.includes('*')).map(toRegex);

const isAllowedOrigin = (origin) =>
  ALLOWED_ORIGINS.includes(origin) || ALLOWED_PATTERNS.some(rx => rx.test(origin));

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
  console.log('ℹ️  CORS_ORIGINS not set. Defaulting to localhost and verified project origin.');
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
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-CSRF-Token','Idempotency-Key'],
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
  validate: { xForwardedForHeader: false },
});
const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests in a short time. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
app.use('/api/', generalLimiter);
app.use('/api/', burstLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);

/* ------------------------------------------------------------------ */
/*  In-memory read cache to protect PostgreSQL from repeated queries   */
/* ------------------------------------------------------------------ */
const serverMemoryCache = new Map();
function cacheMiddleware(ttlSeconds = 20) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `${req.baseUrl || ''}${req.path}_${req.user?.id || 'anon'}`;
    const cached = serverMemoryCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        serverMemoryCache.set(key, { data: body, expiry: Date.now() + (ttlSeconds * 1000) });
      }
      return originalJson(body);
    };
    next();
  };
}

function invalidateServerCache(pattern) {
  for (const k of serverMemoryCache.keys()) {
    if (!pattern || k.includes(pattern)) serverMemoryCache.delete(k);
  }
}

// Automatically invalidate cache on mutations
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET') {
    const resource = req.path.split('/')[1];
    if (resource) invalidateServerCache(resource);
  }
  next();
});

const auth = require('./src/middleware/auth');
const idempotency = require('./src/middleware/idempotency');
app.use('/api', idempotency);

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/portal', require('./src/routes/portal'));

app.use('/api/users', auth, require('./src/routes/users'));
app.use('/api/brands', auth, require('./src/routes/brands'));
app.use('/api/retention', auth, require('./src/routes/health'));
app.use('/api/projects', auth, require('./src/routes/projects'));
app.use('/api/tasks', auth, require('./src/routes/tasks'));
app.use('/api/invoices', auth, require('./src/routes/invoices'));
app.use('/api/payments', auth, require('./src/routes/payments'));
app.use('/api/expenses', auth, require('./src/routes/expenses'));
app.use('/api/meetings', auth, require('./src/routes/meetings'));
app.use('/api/leads', auth, require('./src/routes/leads'));
app.use('/api/notifications', auth, require('./src/routes/notifications'));
app.use('/api/chat', auth, require('./src/routes/chat'));
app.use('/api/settings', auth, cacheMiddleware(30), require('./src/routes/settings'));
app.use('/api/holidays', auth, cacheMiddleware(60), require('./src/routes/holidays'));
app.use('/api/audit-logs', auth, cacheMiddleware(15), require('./src/routes/auditLogs'));
app.use('/api/recurring-invoices', auth, require('./src/routes/recurring-invoices'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

/* ------------------------------------------------------------------ */
/*  Global error handler                                               */
/*  Controllers throw; this converts the throw into a safe response.   */
/* ------------------------------------------------------------------ */
app.use(require('./src/middleware/errorHandler'));

/* ------------------------------------------------------------------ */
/*  Graceful shutdown                                                  */
/* ------------------------------------------------------------------ */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    httpServer.close();
    await pool.end();
    console.log('HTTP server & database pool closed.');
  } catch (err) {
    console.error('Error closing database pool:', err.message);
  }
  process.exit(0);
});

/* ------------------------------------------------------------------ */
/*  Env validation                                                    */
/* ------------------------------------------------------------------ */
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET env var is not set or < 32 chars. Using safe fallback key. Set JWT_SECRET in Render Environment Variables for maximum security.');
}


const PORT = process.env.PORT || 4000;

connectWithRetry()
  .then(async () => {
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
      await pool.query(schema);
      console.log('✅ Schema applied');

      // Run index migrations
      const indexMigration = fs.readFileSync(path.join(__dirname, 'migrations/001_add_indexes.sql'), 'utf8');
      await pool.query(indexMigration).catch(e => console.warn('Index migration warning:', e.message));
      console.log('✅ Index migrations applied');

      await pool.query(`
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS city VARCHAR(100);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE meetings ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
        ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(100);
        ALTER TABLE audit_logs ALTER COLUMN actor_role TYPE VARCHAR(100);
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '₹';
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS team_size VARCHAR(50);
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]';
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS dashboard_layout VARCHAR(30) DEFAULT 'default';
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS dashboard_focus VARCHAR(30) DEFAULT 'balanced';
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT;
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

        -- Brand Retention & SaaS Strategy fields
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '₹';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS retainer_hours NUMERIC(10,2) DEFAULT 40;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS used_hours NUMERIC(10,2) DEFAULT 0;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS nps_score INTEGER DEFAULT 9;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS contract_start_date DATE;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS contract_end_date DATE;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS magic_token VARCHAR(100);

        -- Brand Documents & Contract Vault
        ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Contract';
        ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS renewal_date DATE;
        ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Signed';
        ALTER TABLE brand_documents ADD COLUMN IF NOT EXISTS file_url TEXT;

        -- Invoices per-client currency
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '₹';

        -- Backfill magic tokens for existing brands
        UPDATE brands SET magic_token = 'tok_' || substr(md5(random()::text || id), 1, 24) WHERE magic_token IS NULL;

        UPDATE brands SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE tasks SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE projects SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE invoices SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE payments SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE expenses SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE meetings SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
        UPDATE leads SET owner_id = 'usr_admin' WHERE owner_id IS NULL;
      `).catch(e => console.warn('Migration warning:', e.message));

      await pool.query(`CREATE TABLE IF NOT EXISTS invoice_sequence (
        id VARCHAR(50) PRIMARY KEY,
        next_num INTEGER NOT NULL DEFAULT 42
      )`).catch(() => {});
      await pool.query(`INSERT INTO invoice_sequence (id, next_num) VALUES ('main', 42) ON CONFLICT DO NOTHING`).catch(() => {});
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
    initSocket(httpServer, isAllowedOrigin);
    httpServer.listen(PORT, () => {
      console.log(`🚀 Retentio backend & Socket.io running on port ${PORT}`);

      // Start background runner for recurring invoices (checks every 12 hours)
      const { generateDueRecurring } = require('./src/services/recurring-invoices.service');
      generateDueRecurring().catch(err => console.warn('Initial recurring invoice check warning:', err.message));
      setInterval(() => {
        generateDueRecurring().catch(err => console.warn('Recurring invoice scheduled check warning:', err.message));
      }, 12 * 60 * 60 * 1000);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });
