/**
 * RETENTIO DATABASE SEED SCHEMA SCRIPT
 *
 * Applies the schema and baseline application settings ONLY.
 *
 * No users are seeded. The first account is created through the normal
 * self-registration flow (`POST /auth/verify-otp`), which promotes the first
 * registered user to admin and blocks every registration after that.
 *
 * Seeding fake users was removed because it silently granted real access to
 * accounts the owner never created, and an "auto-seed when the users table is
 * empty" job re-created an admin after the workspace was wiped.
 *
 * Usage: node src/db/seed.js
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./index');

async function runSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied.');
}

async function seed(closePool = false) {
  await runSchema();

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

  console.log('\n✅ Schema seed completed. No users seeded — register the first account in the app.');
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
