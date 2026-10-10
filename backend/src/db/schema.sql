-- Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(200),
  role VARCHAR(20) NOT NULL DEFAULT 'team',
  avatar TEXT,
  designation VARCHAR(200),
  brand_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User-Brand assignments (many-to-many)
CREATE TABLE IF NOT EXISTS user_brand_assignments (
  user_id VARCHAR(50) REFERENCES users(id),
  brand_id VARCHAR(50),
  PRIMARY KEY (user_id, brand_id)
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  owner_name VARCHAR(200),
  mobile VARCHAR(50),
  email VARCHAR(200),
  billing_address TEXT,
  state VARCHAR(100),
  pincode VARCHAR(20),
  gst_number VARCHAR(20),
  pan VARCHAR(20),
  service_details TEXT,
  monthly_fee NUMERIC(12,2) DEFAULT 0,
  billing_cycle_day INTEGER DEFAULT 1,
  onboarding_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'Active',
  payment_status VARCHAR(20) DEFAULT 'Paid',
  last_activity_date DATE DEFAULT CURRENT_DATE,
  last_payment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Brand assigned members (many-to-many)
CREATE TABLE IF NOT EXISTS brand_assignments (
  brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
  member_id VARCHAR(50) REFERENCES users(id),
  PRIMARY KEY (brand_id, member_id)
);

-- Brand documents
CREATE TABLE IF NOT EXISTS brand_documents (
  id VARCHAR(50) PRIMARY KEY,
  brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(200),
  size VARCHAR(50),
  upload_date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(100)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(50) PRIMARY KEY,
  brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  scope TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'Not started',
  billing_amount NUMERIC(12,2),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Project-member assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
  member_id VARCHAR(50) REFERENCES users(id),
  PRIMARY KEY (project_id, member_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50),
  brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  assignee_id VARCHAR(50) REFERENCES users(id),
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'Medium',
  status VARCHAR(30) DEFAULT 'To Do',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  brand_id VARCHAR(50) REFERENCES brands(id),
  brand_name VARCHAR(200),
  issue_date DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  has_gst BOOLEAN DEFAULT false,
  gst_type VARCHAR(20) DEFAULT 'NONE',
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Sent',
  notes TEXT,
  payment_date DATE,
  payment_mode VARCHAR(50),
  razorpay_payment_id VARCHAR(100),
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  hsn_sac VARCHAR(20),
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  amount NUMERIC(12,2) DEFAULT 0
);

-- Recurring invoice schedules
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id),
  brand_id VARCHAR(50) REFERENCES brands(id),
  frequency VARCHAR(20) DEFAULT 'Monthly',
  next_due_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id),
  brand_id VARCHAR(50) REFERENCES brands(id),
  brand_name VARCHAR(200),
  amount NUMERIC(12,2),
  payment_date DATE,
  mode VARCHAR(50),
  reference_no VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Success',
  proof_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  amount NUMERIC(12,2),
  date DATE,
  payment_mode VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'Paid',
  employee_name VARCHAR(255),
  employee_id VARCHAR(50),
  note TEXT,
  receipt_url TEXT,
  brand_id VARCHAR(50),
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(300),
  brand_id VARCHAR(50),
  lead_id VARCHAR(50),
  date DATE,
  time VARCHAR(20),
  duration_minutes INTEGER DEFAULT 60,
  link_or_location TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting attendees
CREATE TABLE IF NOT EXISTS meeting_attendees (
  meeting_id VARCHAR(50) REFERENCES meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(50),
  PRIMARY KEY (meeting_id, user_id)
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200),
  company VARCHAR(200),
  contact VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(50),
  source VARCHAR(100),
  stage VARCHAR(30) DEFAULT 'New',
  value NUMERIC(12,2) DEFAULT 0,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50),
  title VARCHAR(300),
  message TEXT,
  timestamp VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  link_module VARCHAR(50),
  brand_id VARCHAR(50),
  recipient_roles TEXT[],
  target_user_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) DEFAULT 'brand',
  title VARCHAR(200),
  brand_id VARCHAR(50),
  last_message TEXT,
  last_message_time VARCHAR(50),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(50),
  PRIMARY KEY (conversation_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(50),
  sender_name VARCHAR(200),
  sender_role VARCHAR(20),
  text TEXT,
  timestamp VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_read_by (
  message_id VARCHAR(50) REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id VARCHAR(50),
  PRIMARY KEY (message_id, user_id)
);

-- Message attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  id VARCHAR(50) PRIMARY KEY,
  message_id VARCHAR(50) REFERENCES chat_messages(id) ON DELETE CASCADE,
  name VARCHAR(200),
  size VARCHAR(50),
  url TEXT,
  type VARCHAR(50)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
  company_name VARCHAR(200),
  company_email VARCHAR(200),
  company_phone VARCHAR(50),
  company_address TEXT,
  company_gst VARCHAR(20),
  company_pan VARCHAR(20),
  company_state VARCHAR(100),
  default_gst_rate NUMERIC(5,2) DEFAULT 18,
  default_hsn_sac VARCHAR(20),
  invoice_prefix VARCHAR(50) DEFAULT 'INV-2026-',
  bank_account_name VARCHAR(200),
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(20),
  bank_branch VARCHAR(200),
  upi_id VARCHAR(100),
  razorpay_key_id VARCHAR(100),
  razorpay_connected BOOLEAN DEFAULT false,
  subscription_plan_name VARCHAR(100),
  subscription_price NUMERIC(10,2) DEFAULT 0,
  subscription_billing_cycle VARCHAR(20),
  subscription_renewal_date DATE,
  subscription_status VARCHAR(30) DEFAULT 'Active',
  retention_threshold_days INTEGER DEFAULT 30,
  whatsapp_enabled BOOLEAN DEFAULT true,
  invoice_design JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200),
  date DATE,
  type VARCHAR(50) DEFAULT 'Agency Custom'
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp VARCHAR(50),
  actor_name VARCHAR(200),
  actor_role VARCHAR(50),
  action VARCHAR(200),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTP Verifications (for registration email verification)
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(200) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'register',
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
