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
  ? 'http://localhost:5173,http://localhost:4173,https://client-crm.pages.dev,https://client-crm.dhameliyaavadh592.workers.dev'
  : 'http://localhost:5173,http://localhost:4173';
const RAW_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
  .split(',').map(s => s.trim()).filter(Boolean);

// Strict subdomain matching: * matches a single valid DNS label [a-zA-Z0-9-]+ only
const toRegex = (pattern) =>
  new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-zA-Z0-9-]+') + '$');

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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
const sensitiveOpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many reset attempts. Please wait 15 minutes.' },
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
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/reset-password', otpLimiter);
app.use('/api/settings/reset-data', sensitiveOpLimiter);

/* ------------------------------------------------------------------ */
/*  In-memory read cache to protect PostgreSQL from repeated queries   */
/* ------------------------------------------------------------------ */
const serverMemoryCache = new Map();
function cacheMiddleware(ttlSeconds = 20) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `${req.baseUrl || ''}${req.path}_${req.user?.agencyId || req.user?.id || 'anon'}`;
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
app.post('/api/intake', require('./src/controllers/portal.controller').intakeClient);

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
  console.error('❌ FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters. Server startup halted.');
  process.exit(1);
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
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS survey_reminder_scheduled_at TIMESTAMP;
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

        -- Multi-Agency Workspace Isolation
        ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE meetings ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE holidays ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);
        ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50);

        -- Backfill legacy records to legacy admin agency ('usr_admin') or user's own admin id
        UPDATE users SET agency_id = id WHERE role = 'admin' AND agency_id IS NULL;
        UPDATE users SET agency_id = created_by WHERE created_by IS NOT NULL AND agency_id IS NULL;
        UPDATE users SET agency_id = 'usr_admin' WHERE agency_id IS NULL;

        UPDATE brands SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE tasks SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE projects SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE invoices SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE payments SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE expenses SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE meetings SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE leads SET agency_id = COALESCE(owner_id, 'usr_admin') WHERE agency_id IS NULL;
        UPDATE notifications SET agency_id = 'usr_admin' WHERE agency_id IS NULL;
        UPDATE settings SET agency_id = 'usr_admin' WHERE id = 'main' AND agency_id IS NULL;
        UPDATE holidays SET agency_id = 'usr_admin' WHERE agency_id IS NULL AND type != 'National';
        UPDATE conversations SET agency_id = 'usr_admin' WHERE agency_id IS NULL;
        UPDATE recurring_invoices SET agency_id = 'usr_admin' WHERE agency_id IS NULL;
        UPDATE audit_logs SET agency_id = 'usr_admin' WHERE agency_id IS NULL;
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

      // NOTE: no data-destruction block runs at boot. An earlier version
      // deleted every user and all relational records once, then re-seeded an
      // admin whenever the users table was empty. That loop made "wipe the
      // workspace" silently hand access back to an account the owner never
      // created, and is the root cause of repeated phantom-session bugs.
      // Wiping data is an explicit operator action (scripts/reset-test-data.js).

      // Baseline application settings only. No users are ever seeded here:
      // the first account is created through POST /auth/verify-otp, which
      // promotes that one registration to admin and blocks all later ones.
      await pool.query(`
        INSERT INTO settings (id, default_gst_rate, invoice_prefix, retention_threshold_days)
        VALUES ('main', 18, 'INV-2026-', 30)
        ON CONFLICT (id) DO NOTHING
      `).catch(() => {});
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

      // Start background runner for automated 1-click micro-survey reminders (checks every 60s)
      const { processScheduledSurveyReminders } = require('./src/services/portal.service');
      setInterval(() => {
        processScheduledSurveyReminders().catch(err => console.warn('Survey reminder check warning:', err.message));
      }, 60 * 1000);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });
