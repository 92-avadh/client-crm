/**
 * RETENTIO SEED DATA
 *
 * Test Users (all passwords: Admin@1234):
 *   ADMIN:  alex@retentio.co          (usr_admin)
 *   HR:     sarah.j@retentio.co       (usr_hr)
 *   TEAM:   rahul.v@retentio.co       (usr_team_rahul)   → Apex Media, Zephyr Cloud Labs
 *   TEAM:   priya.s@retentio.co       (usr_team_priya)   → NovaPulse, Solis
 *   BRAND:  vikram@apexmedia.in       (usr_brand_vikram) → Apex Media CFO
 *
 * To reset: truncate tables (or drop/recreate schema), then re-run this script.
 * All inserts use ON CONFLICT DO NOTHING, so re-running is safe without truncation.
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

  // Users
  await pool.query(`
    INSERT INTO users (id, name, email, phone, password_hash, role, designation, is_active) VALUES
    ('usr_admin', 'Alex Rivera', 'alex@retentio.co', '+91 98765 43210', $1, 'admin', 'Agency Founder & Managing Director', true),
    ('usr_hr', 'Sarah Jenkins', 'sarah.j@retentio.co', '+91 98223 11445', $1, 'hr', 'Operations & Client Onboarding Manager', true),
    ('usr_team_rahul', 'Rahul Verma', 'rahul.v@retentio.co', '+91 97112 88390', $1, 'team', 'Senior CA & Client Account Lead', true),
    ('usr_team_priya', 'Priya Sharma', 'priya.s@retentio.co', '+91 94001 22883', $1, 'team', 'Growth & Social Strategy Specialist', true),
    ('usr_brand_vikram', 'Vikram Seth', 'vikram@apexmedia.in', '+91 99880 11223', $1, 'brand', 'Co-founder & CFO Apex Media', true)
    ON CONFLICT DO NOTHING
  `, [passwordHash]);
  console.log('Users seeded.');

  // Brands
  await pool.query(`
    INSERT INTO brands (id, name, owner_name, mobile, email, billing_address, state, pincode, gst_number, pan, service_details, monthly_fee, billing_cycle_day, onboarding_date, status, last_activity_date, last_payment_date) VALUES
    ('brand_apex', 'Apex Media Solutions', 'Vikram Seth', '+91 99880 11223', 'vikram@apexmedia.in', '42, Andheri Industrial Estate, Mumbai', 'Maharashtra', '400053', '27AAPCA1234C1ZX', 'AAPCA1234C', 'Monthly Retainer: SEO, Social Media Management, Content Creation, Monthly Reports', 45000, 1, '2024-03-15', 'Active', '2026-09-28', '2026-09-01'),
    ('brand_zephyr', 'Zephyr Technologies', 'Ananya Krishnan', '+91 98123 45678', 'ananya.k@zephyrtech.io', '7th Floor, Prestige Tower, Bangalore', 'Karnataka', '560025', '29AADCZ5678P1ZA', 'AADCZ5678P', 'Performance Marketing, Google Ads, LinkedIn Ads, Weekly Analytics Dashboard', 62000, 5, '2024-06-01', 'Active', '2026-09-30', '2026-09-05'),
    ('brand_novapulse', 'NovaPulse Retail', 'Suresh Patel', '+91 97001 33221', 'suresh@novapulse.in', 'Shop No. 12, Navrangpura, Ahmedabad', 'Gujarat', '380009', '24AAECN9012Q1ZB', 'AAECN9012Q', 'Social Media Management, Festive Campaign Design, Influencer Outreach', 28000, 10, '2025-01-10', 'Active', '2026-09-25', '2026-09-10'),
    ('brand_solis', 'Solis Healthcare', 'Dr. Meena Iyer', '+91 94455 66778', 'meena.iyer@solishealthcare.com', 'Plot 88, Hitech City, Hyderabad', 'Telangana', '500081', '36AAGCS3456R1ZC', 'AAGCS3456R', 'Healthcare Content Marketing, Patient Education Videos, Website SEO', 35000, 15, '2025-03-20', 'Active', '2026-09-15', '2026-08-15'),
    ('brand_lumen', 'Lumen Fintech', 'Rajesh Nair', '+91 90000 11234', 'rajesh@lumenfintech.com', 'Unit 4B, DLF Cyber City, Gurgaon', 'Haryana', '122002', '06AAACL7890S1ZD', 'AAACL7890S', 'Brand Strategy, Investor Deck Design, PR & Media Relations', 75000, 20, '2024-11-05', 'Churned', '2026-06-01', '2026-05-20')
    ON CONFLICT DO NOTHING
  `);
  console.log('Brands seeded.');

  // Update brand_id for brand user
  await pool.query(`UPDATE users SET brand_id = 'brand_apex' WHERE id = 'usr_brand_vikram' AND brand_id IS NULL`);

  // Brand assignments
  await pool.query(`
    INSERT INTO brand_assignments (brand_id, member_id) VALUES
    ('brand_apex', 'usr_team_rahul'),
    ('brand_zephyr', 'usr_team_rahul'),
    ('brand_novapulse', 'usr_team_priya'),
    ('brand_solis', 'usr_team_priya')
    ON CONFLICT DO NOTHING
  `);

  // User-brand assignments (mirror)
  await pool.query(`
    INSERT INTO user_brand_assignments (user_id, brand_id) VALUES
    ('usr_team_rahul', 'brand_apex'),
    ('usr_team_rahul', 'brand_zephyr'),
    ('usr_team_priya', 'brand_novapulse'),
    ('usr_team_priya', 'brand_solis')
    ON CONFLICT DO NOTHING
  `);
  console.log('Brand assignments seeded.');

  // Projects
  await pool.query(`
    INSERT INTO projects (id, brand_id, name, scope, start_date, end_date, status, billing_amount, progress) VALUES
    ('proj_apex_1', 'brand_apex', 'Q4 Brand Refresh & SEO Overhaul', 'Complete website SEO audit, refresh brand guidelines, update all social media profiles, and create a Q4 content calendar.', '2026-09-01', '2026-11-30', 'In Progress', 120000, 35),
    ('proj_zephyr_1', 'brand_zephyr', 'Performance Marketing Scale-Up', 'Scale Google and LinkedIn ad campaigns, implement A/B testing, optimize landing pages for conversion.', '2026-08-15', '2026-12-15', 'In Progress', 95000, 60),
    ('proj_novapulse_1', 'brand_novapulse', 'Diwali Festive Campaign 2026', 'End-to-end festive campaign including creative design, influencer tie-ups, and paid social amplification.', '2026-09-15', '2026-11-15', 'Not started', 55000, 0),
    ('proj_solis_1', 'brand_solis', 'Patient Education Video Series', 'Produce 12 short-form educational videos on common health topics for YouTube and Instagram Reels.', '2026-07-01', '2026-10-31', 'In Progress', 80000, 75)
    ON CONFLICT DO NOTHING
  `);

  // Project assignments
  await pool.query(`
    INSERT INTO project_assignments (project_id, member_id) VALUES
    ('proj_apex_1', 'usr_team_rahul'),
    ('proj_zephyr_1', 'usr_team_rahul'),
    ('proj_novapulse_1', 'usr_team_priya'),
    ('proj_solis_1', 'usr_team_priya')
    ON CONFLICT DO NOTHING
  `);
  console.log('Projects seeded.');

  // Tasks
  await pool.query(`
    INSERT INTO tasks (id, project_id, brand_id, title, description, assignee_id, due_date, priority, status) VALUES
    ('task_001', 'proj_apex_1', 'brand_apex', 'Complete Q4 SEO audit report', 'Conduct full technical SEO audit using SEMrush and prepare detailed report with recommendations.', 'usr_team_rahul', '2026-10-10', 'High', 'In Progress'),
    ('task_002', 'proj_zephyr_1', 'brand_zephyr', 'Set up Google Ads conversion tracking', 'Implement enhanced conversion tracking across all campaign landing pages.', 'usr_team_rahul', '2026-10-05', 'High', 'Done'),
    ('task_003', 'proj_novapulse_1', 'brand_novapulse', 'Finalize Diwali campaign creative brief', 'Create detailed creative brief including mood board, copy direction, and influencer shortlist.', 'usr_team_priya', '2026-09-30', 'Medium', 'To Do'),
    ('task_004', 'proj_solis_1', 'brand_solis', 'Script approval for video #7 - Diabetes Management', 'Get client sign-off on video script before production begins.', 'usr_team_priya', '2026-10-08', 'Medium', 'In Progress'),
    ('task_005', 'proj_apex_1', 'brand_apex', 'Update brand social media bios and headers', 'Refresh all social media profile bios, cover photos, and headers as per new brand guidelines.', 'usr_team_rahul', '2026-10-15', 'Low', 'To Do')
    ON CONFLICT DO NOTHING
  `);
  console.log('Tasks seeded.');

  // Invoices
  await pool.query(`
    INSERT INTO invoices (id, invoice_number, brand_id, brand_name, issue_date, due_date, subtotal, has_gst, gst_type, cgst_amount, sgst_amount, igst_amount, total_amount, paid_amount, status, notes, payment_date, payment_mode, is_recurring) VALUES
    ('inv_101', 'INV-2026-0042', 'brand_apex', 'Apex Media Solutions', '2026-09-01', '2026-09-15', 45000, true, 'CGST_SGST', 4050, 4050, 0, 53100, 53100, 'Paid', 'Monthly retainer for September 2026', '2026-09-12', 'Bank Transfer', true),
    ('inv_102', 'INV-2026-0043', 'brand_zephyr', 'Zephyr Technologies', '2026-09-05', '2026-09-20', 62000, true, 'CGST_SGST', 5580, 5580, 0, 73160, 0, 'Sent', 'Monthly retainer + Performance marketing setup fee for September 2026', NULL, NULL, false),
    ('inv_103', 'INV-2026-0044', 'brand_novapulse', 'NovaPulse Retail', '2026-08-01', '2026-08-15', 28000, true, 'IGST', 0, 0, 5040, 33040, 16520, 'Partially Paid', 'Monthly retainer for August 2026', NULL, NULL, false),
    ('inv_104', 'INV-2026-0041', 'brand_solis', 'Solis Healthcare', '2026-08-01', '2026-08-20', 35000, true, 'IGST', 0, 0, 6300, 41300, 0, 'Overdue', 'Monthly retainer for August 2026. Payment pending due to client delay.', NULL, NULL, false)
    ON CONFLICT DO NOTHING
  `);

  // Invoice items
  await pool.query(`
    INSERT INTO invoice_items (id, invoice_id, description, hsn_sac, quantity, unit_price, amount) VALUES
    ('ii_101_1', 'inv_101', 'Monthly Retainer - SEO & Social Media Management', '998311', 1, 45000, 45000),
    ('ii_102_1', 'inv_102', 'Monthly Retainer - Performance Marketing', '998311', 1, 55000, 55000),
    ('ii_102_2', 'inv_102', 'One-time Setup Fee - Campaign Infrastructure', '998311', 1, 7000, 7000),
    ('ii_103_1', 'inv_103', 'Monthly Retainer - Social Media & Design', '998311', 1, 28000, 28000),
    ('ii_104_1', 'inv_104', 'Monthly Retainer - Healthcare Content Marketing', '998311', 1, 35000, 35000)
    ON CONFLICT DO NOTHING
  `);
  console.log('Invoices seeded.');

  // Payments
  await pool.query(`
    INSERT INTO payments (id, invoice_id, brand_id, brand_name, amount, payment_date, mode, reference_no, status) VALUES
    ('pay_001', 'inv_101', 'brand_apex', 'Apex Media Solutions', 53100, '2026-09-12', 'Bank Transfer', 'NEFT2026091200123', 'Success'),
    ('pay_002', 'inv_103', 'brand_novapulse', 'NovaPulse Retail', 16520, '2026-08-20', 'UPI', 'UPI202608200456', 'Success'),
    ('pay_003', 'inv_101', 'brand_apex', 'Apex Media Solutions', 45000, '2026-08-03', 'Bank Transfer', 'NEFT2026080300789', 'Success')
    ON CONFLICT DO NOTHING
  `);
  console.log('Payments seeded.');

  // Expenses
  await pool.query(`
    INSERT INTO expenses (id, category, amount, date, payment_mode, note, brand_id, is_recurring) VALUES
    ('exp_001', 'Software Subscriptions', 12500, '2026-09-01', 'Credit Card', 'Annual SEMrush subscription (monthly split)', NULL, true),
    ('exp_002', 'Team Salaries', 180000, '2026-09-05', 'Bank Transfer', 'September 2026 payroll - 3 team members', NULL, true),
    ('exp_003', 'Freelance / Contractor', 25000, '2026-09-10', 'Bank Transfer', 'Video editor fee - Solis Healthcare project videos #5 to #8', 'brand_solis', false),
    ('exp_004', 'Office & Admin', 4500, '2026-09-15', 'Cash', 'Office stationery and printing supplies', NULL, false),
    ('exp_005', 'Advertising & Promotion', 8000, '2026-09-20', 'Credit Card', 'Sponsored LinkedIn post for agency self-promotion', NULL, false)
    ON CONFLICT DO NOTHING
  `);
  console.log('Expenses seeded.');

  // Meetings
  await pool.query(`
    INSERT INTO meetings (id, title, brand_id, lead_id, date, time, duration_minutes, link_or_location, notes) VALUES
    ('meet_001', 'Monthly Strategy Review - Apex Media', 'brand_apex', NULL, '2026-10-08', '11:00', 60, 'https://meet.google.com/abc-defg-hij', 'Review Q4 SEO audit progress, discuss content calendar for November.'),
    ('meet_002', 'Diwali Campaign Kickoff - NovaPulse', 'brand_novapulse', NULL, '2026-10-10', '15:00', 90, 'https://zoom.us/j/987654321', 'Kickoff meeting for Diwali 2026 campaign. Present creative brief and get sign-off.'),
    ('meet_003', 'New Lead Discovery Call - FreshBrew', NULL, 'lead_003', '2026-10-12', '10:00', 45, 'https://meet.google.com/xyz-uvwx-yz1', 'Initial discovery call with FreshBrew Coffee. Understand their marketing needs and budget.')
    ON CONFLICT DO NOTHING
  `);

  // Meeting attendees
  await pool.query(`
    INSERT INTO meeting_attendees (meeting_id, user_id) VALUES
    ('meet_001', 'usr_admin'),
    ('meet_001', 'usr_team_rahul'),
    ('meet_002', 'usr_admin'),
    ('meet_002', 'usr_team_priya'),
    ('meet_003', 'usr_admin'),
    ('meet_003', 'usr_hr')
    ON CONFLICT DO NOTHING
  `);
  console.log('Meetings seeded.');

  // Leads
  await pool.query(`
    INSERT INTO leads (id, name, company, contact, email, phone, source, stage, value, follow_up_date, notes) VALUES
    ('lead_001', 'Priyanka Menon', 'BloomBox Wellness', 'Founder & CEO', 'priyanka@bloomboxwellness.com', '+91 98001 23456', 'LinkedIn', 'Proposal Sent', 40000, '2026-10-10', 'Interested in SEO and content marketing. Sent proposal on Sep 25th. Waiting for feedback.'),
    ('lead_002', 'Kartik Ahluwalia', 'SwiftCart Ecommerce', 'Head of Marketing', 'kartik.a@swiftcart.in', '+91 97555 88990', 'Referral', 'Qualified', 75000, '2026-10-07', 'Referred by Vikram Seth (Apex Media). Needs performance marketing + social media. High potential.'),
    ('lead_003', 'Nisha Fernandes', 'FreshBrew Coffee', 'Brand Manager', 'nisha.f@freshbrew.co', '+91 96333 11220', 'Website Inquiry', 'New', 25000, '2026-10-12', 'Inquired via website contact form. Wants help with Instagram and local SEO.'),
    ('lead_004', 'Dhruv Mehta', 'UrbanNest Interiors', 'Co-founder', 'dhruv@urbannest.in', '+91 94778 22110', 'Cold Outreach', 'Contacted', 55000, '2026-10-15', 'Reached out via cold email. Building a premium interior design brand. Needs full-stack digital presence.')
    ON CONFLICT DO NOTHING
  `);
  console.log('Leads seeded.');

  // Notifications
  await pool.query(`
    INSERT INTO notifications (id, type, title, message, timestamp, is_read, link_module, brand_id, recipient_roles) VALUES
    ('notif_001', 'payment', '💰 Payment Received: ₹53,100', 'Full payment received from Apex Media Solutions for Invoice INV-2026-0042.', '2026-09-12T14:30:00.000Z', true, 'invoices', 'brand_apex', ARRAY['admin','hr']),
    ('notif_002', 'retention', '⚠️ Retention Alert: Solis Healthcare', 'Solis Healthcare has not been active for 20 days. Last payment is overdue. Consider reaching out.', '2026-09-30T09:00:00.000Z', false, 'brands', 'brand_solis', ARRAY['admin']),
    ('notif_003', 'invoice', '🧾 Invoice Overdue: INV-2026-0041', 'Invoice INV-2026-0041 for Solis Healthcare is now 41 days overdue. Total: ₹41,300.', '2026-09-30T09:01:00.000Z', false, 'invoices', 'brand_solis', ARRAY['admin','hr']),
    ('notif_004', 'task', '✅ Task Completed: Google Ads Conversion Tracking', 'Rahul Verma marked "Set up Google Ads conversion tracking" as Done for Zephyr Technologies.', '2026-09-29T16:45:00.000Z', false, 'tasks', 'brand_zephyr', ARRAY['admin'])
    ON CONFLICT DO NOTHING
  `);
  console.log('Notifications seeded.');

  // Conversations
  await pool.query(`
    INSERT INTO conversations (id, type, title, brand_id, last_message, last_message_time, unread_count) VALUES
    ('conv_apex_internal', 'brand', 'Apex Media - Internal', 'brand_apex', 'SEO audit draft is ready for review. Sharing the doc now.', '2026-09-30T11:30:00.000Z', 2),
    ('conv_zephyr_internal', 'brand', 'Zephyr Technologies - Internal', 'brand_zephyr', 'Let''s schedule the campaign review for next week.', '2026-09-29T17:00:00.000Z', 0),
    ('conv_team_general', 'team', 'Team General', NULL, 'Reminder: Monday stand-up at 10 AM.', '2026-09-28T09:00:00.000Z', 1)
    ON CONFLICT DO NOTHING
  `);

  // Conversation participants
  await pool.query(`
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    ('conv_apex_internal', 'usr_admin'),
    ('conv_apex_internal', 'usr_team_rahul'),
    ('conv_zephyr_internal', 'usr_admin'),
    ('conv_zephyr_internal', 'usr_team_rahul'),
    ('conv_team_general', 'usr_admin'),
    ('conv_team_general', 'usr_hr'),
    ('conv_team_general', 'usr_team_rahul'),
    ('conv_team_general', 'usr_team_priya')
    ON CONFLICT DO NOTHING
  `);

  // Chat messages
  await pool.query(`
    INSERT INTO chat_messages (id, conversation_id, sender_id, sender_name, sender_role, text, timestamp) VALUES
    ('msg_001', 'conv_apex_internal', 'usr_admin', 'Alex Rivera', 'admin', 'Hey Rahul, how is the SEO audit coming along?', '2026-09-30T11:00:00.000Z'),
    ('msg_002', 'conv_apex_internal', 'usr_team_rahul', 'Rahul Verma', 'team', 'SEO audit draft is ready for review. Sharing the doc now.', '2026-09-30T11:30:00.000Z'),
    ('msg_003', 'conv_team_general', 'usr_hr', 'Sarah Jenkins', 'hr', 'Reminder: Monday stand-up at 10 AM.', '2026-09-28T09:00:00.000Z')
    ON CONFLICT DO NOTHING
  `);

  // Message read receipts
  await pool.query(`
    INSERT INTO message_read_by (message_id, user_id) VALUES
    ('msg_001', 'usr_admin'),
    ('msg_001', 'usr_team_rahul'),
    ('msg_002', 'usr_team_rahul'),
    ('msg_003', 'usr_hr')
    ON CONFLICT DO NOTHING
  `);
  console.log('Conversations + chat seeded.');

  // Settings
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
    ON CONFLICT DO NOTHING
  `);
  console.log('Settings seeded.');

  // Holidays
  await pool.query(`
    INSERT INTO holidays (id, title, date, type) VALUES
    ('hol_001', 'Republic Day', '2026-01-26', 'National'),
    ('hol_002', 'Holi', '2026-03-14', 'National'),
    ('hol_003', 'Independence Day', '2026-08-15', 'National'),
    ('hol_004', 'Diwali', '2026-10-20', 'National'),
    ('hol_005', 'Agency Foundation Day', '2026-11-05', 'Agency Custom'),
    ('hol_006', 'Christmas', '2026-12-25', 'National')
    ON CONFLICT DO NOTHING
  `);
  console.log('Holidays seeded.');

  // Audit logs
  await pool.query(`
    INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address) VALUES
    ('audit_001', '2026-09-12T14:30:00.000Z', 'Alex Rivera', 'admin', 'PAYMENT_RECORDED', 'Recorded payment of ₹53,100 for Invoice INV-2026-0042 from Apex Media Solutions.', '192.168.1.10'),
    ('audit_002', '2026-09-25T10:15:00.000Z', 'Sarah Jenkins', 'hr', 'INVOICE_CREATED', 'Created Invoice INV-2026-0043 for Zephyr Technologies. Total: ₹73,160.', '192.168.1.12'),
    ('audit_003', '2026-09-29T16:45:00.000Z', 'Rahul Verma', 'team', 'TASK_STATUS_UPDATED', 'Updated task "Set up Google Ads conversion tracking" status to Done for Zephyr Technologies.', '192.168.1.15')
    ON CONFLICT DO NOTHING
  `);
  console.log('Audit logs seeded.');

  console.log('\nAll seed data inserted successfully!');
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
