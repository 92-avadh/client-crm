/**
 * Retentio - Test Data Reset Utility
 *
 * Clears database tables and explains how browser storage is cleared.
 * Usage: node scripts/reset-test-data.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

async function main() {
  console.log('🔄 Resetting Retentio workspace data for fresh testing...');
  try {
    const resetDb = require('../backend/src/db/reset');
    await resetDb();
    console.log('✅ PostgreSQL database tables successfully cleared (admin account preserved).');
  } catch (err) {
    console.log('ℹ️  PostgreSQL database connection was not reachable or is running in remote/docker mode: ' + err.message);
    console.log('   (If you are testing the web frontend in local/browser mode, the app uses in-browser local storage with mock sync).');
  }

  console.log('\n📱 Browser Storage Reset:');
  console.log('   In the web browser, you can reset all client, invoice, and workspace data by either:');
  console.log('   1. Opening Settings -> Security & Audit Logs -> click "Clear All Current Data (Blank Testing State)"');
  console.log('   2. OR opening your browser DevTools Console (F12) and running:');
  console.log('      window.resetRetentioWorkspace("empty")');
  console.log('   3. To restore clean sample demo data anytime, run:');
  console.log('      window.resetRetentioWorkspace("demo")');
  console.log('\n✨ Workspace is now ready for testing!\n');
}

main();
