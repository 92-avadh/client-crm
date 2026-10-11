/**
 * Script to clear all users and associated relational data from the database.
 * Run directly via: node src/db/clear-users.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./index');

async function clearAllUsers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🧹 Clearing all users and associated records from database...');

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

    await client.query('DELETE FROM users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS _system_migrations (
        name VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`
      INSERT INTO _system_migrations (name)
      VALUES ('clear_all_users_for_fresh_testing_v1')
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully removed all users and data from the database. Ready for fresh account registration.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clear database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllUsers();
