/**
 * RETENTIO DATABASE RESET SCRIPT
 *
 * Clears all user-added data from every table while preserving the schema.
 * Safe to re-run — schema is never dropped or modified.
 *
 * Usage:  node src/db/reset.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./index');

async function reset() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete in dependency order (children before parents) to satisfy FK constraints
    await client.query('DELETE FROM message_read_by');
    await client.query('DELETE FROM message_attachments');
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM conversation_participants');
    await client.query('DELETE FROM conversations');

    await client.query('DELETE FROM meeting_attendees');
    await client.query('DELETE FROM meetings');

    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM otp_verifications');
    await client.query('DELETE FROM holidays');

    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM invoice_items');
    await client.query('DELETE FROM recurring_invoices');
    await client.query('DELETE FROM invoices');

    await client.query('DELETE FROM expenses');
    await client.query('DELETE FROM leads');

    await client.query('DELETE FROM project_assignments');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM projects');

    await client.query('DELETE FROM brand_assignments');
    await client.query('DELETE FROM user_brand_assignments');
    await client.query('DELETE FROM brand_documents');
    await client.query('DELETE FROM brands');

    // Remove every user. No account is seeded with a reserved id any more, so
    // the workspace genuinely starts empty and the owner re-registers through
    // the normal self-registration flow.
    await client.query('DELETE FROM users');

    // Reset settings to defaults (keep the row so the app does not error)
    await client.query(`
      UPDATE settings SET
        company_name        = NULL,
        company_email       = NULL,
        company_phone       = NULL,
        company_address     = NULL,
        company_gst         = NULL,
        company_pan         = NULL,
        company_state       = NULL,
        bank_account_name   = NULL,
        bank_account_number = NULL,
        bank_ifsc           = NULL,
        bank_branch         = NULL,
        upi_id              = NULL,
        razorpay_key_id     = NULL,
        razorpay_connected  = false,
        invoice_prefix      = 'INV-2026-',
        default_gst_rate    = 18,
        currency            = 'INR',
        currency_symbol     = '₹',
        industry            = NULL,
        team_size           = NULL,
        goals               = '[]'::jsonb,
        dashboard_layout    = 'default',
        dashboard_focus     = 'balanced',
        updated_at          = NOW()
      WHERE id = 'main'
    `);

    await client.query('COMMIT');
    console.log('Database reset complete. All data cleared (admin user preserved).');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset failed, rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  reset().catch(() => process.exit(1));
}

module.exports = reset;
