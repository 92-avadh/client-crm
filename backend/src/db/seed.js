/**
 * RETENTIO DATABASE SEED SCRIPT (CLEAN / BLANK STATE)
 *
 * Seeds core schema, baseline application settings, and the default admin user:
 *   ADMIN:  alex@retentio.co  /  Admin@1234  (usr_admin)
 *
 * All demo brands, projects, tasks, invoices, payments, expenses,
 * meetings, and audit logs are omitted to ensure a fresh, empty workspace.
 *
 * Usage: node src/db/seed.js
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./index');

async function runSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied.');
}

async function seed(closePool = false) {
  await runSchema();

  const passwordHash = await bcrypt.hash('Admin@1234', 10);

  // Admin User
  await pool.query(`
    INSERT INTO users (id, name, email, phone, password_hash, role, designation, is_active) VALUES
    ('usr_admin', 'Alex Rivera', 'alex@retentio.co', '+91 98765 43210', $1, 'admin', 'Agency Founder & Managing Director', true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      designation = EXCLUDED.designation,
      is_active = true
  `, [passwordHash]);
  console.log('Admin user seeded (alex@retentio.co).');

  // Core Settings
  await pool.query(`
    INSERT INTO settings (id, company_name, company_email, company_phone, company_address, company_gst, company_pan, company_state,
      default_gst_rate, default_hsn_sac, invoice_prefix,
      bank_account_name, bank_account_number, bank_ifsc, bank_branch, upi_id,
      razorpay_key_id, razorpay_connected,
      subscription_plan_name, subscription_price, subscription_billing_cycle, subscription_renewal_date, subscription_status,
      retention_threshold_days, whatsapp_enabled, invoice_design)
    VALUES (
      'main', 'Retentio Agency', 'billing@retentio.co', '+91 98765 43210',
      '501, Prestige Business Tower, Andheri East, Mumbai, Maharashtra - 400069',
      '27AABCR1234M1ZX', 'AABCR1234M', 'Maharashtra',
      18, '998311', 'INV-2026-',
      'Retentio Agency LLP', '50200012345678', 'HDFC0001234', 'HDFC Bank, Andheri East', 'retentio@upi',
      'rzp_live_XXXXXXXXXXXXXXX', false,
      'Growth', 4999, 'Monthly', '2026-11-01', 'Active',
      30, true,
      '{"primaryColor":"#4F46E5","accentColor":"#10B981","fontFamily":"Inter","showLogo":true,"showSignature":true,"bankDetailsOnInvoice":true,"footerText":"Thank you for your business!"}'
    )
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('Core settings seeded.');

  console.log('\n✅ Blank database seed completed successfully (admin user and core settings preserved).');
  if (closePool) {
    await pool.end();
  }
}

if (require.main === module) {
  seed(true).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;
