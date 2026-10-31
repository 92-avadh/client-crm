export type CorporateRole =
  | 'admin'
  | 'hr'
  | 'team'
  | 'brand'
  | 'project_manager'
  | 'operations_manager'
  | 'finance'
  | 'sales'
  | 'marketing'
  | 'account_executive'
  | 'creative_designer'
  | 'developer';

export type Role = CorporateRole | (string & {});

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string;
  designation: string;
  assignedBrandIds?: string[];
  brandId?: string;
  permissions?: string[];
  isActive?: boolean;
  status?: string;
}

export type BrandStatus = 'Active' | 'Paused' | 'Inactive' | 'Churned';

export interface BrandDocument {
  id: string;
  brandId?: string;
  name: string;
  size: string;
  uploadDate: string;
  type: string;
  category?: 'MSA' | 'SOW' | 'NDA' | 'KYC & Tax' | 'Contract' | 'Other' | string;
  renewalDate?: string;
  status?: 'Signed' | 'Pending' | 'Expired';
  fileUrl?: string;
}

export interface DeliverableItem {
  id: string;
  title: string;
  target: number;
  completed: number;
  unit?: string;
}

export interface Brand {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  billingAddress: string;
  city?: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  pan?: string;
  serviceDetails: string;
  monthlyFee: number;
  billingCycleDay: number;
  currency?: string;
  currencySymbol?: string;
  retainerHours?: number;
  usedHours?: number;
  npsScore?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  magicToken?: string;
  onboardingDate: string;
  notes?: string;
  status: BrandStatus;
  paymentStatus?: 'Paid' | 'Pending';
  assignedMemberIds: string[];
  lastActivityDate: string;
  lastPaymentDate: string;
  documents: BrandDocument[];
  deliverables?: DeliverableItem[];
  surveyReminderScheduledAt?: string;
}

export type ProjectStatus = 'Not started' | 'In progress' | 'On hold' | 'Completed';

export interface Project {
  id: string;
  brandId: string;
  name: string;
  scope: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  assignedMemberIds: string[];
  billingAmount?: number;
  progress: number;
}

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';

export interface Task {
  id: string;
  projectId?: string;
  brandId: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  brandId: string;
  brandName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  hasGst: boolean;
  gstType: 'CGST_SGST' | 'IGST' | 'NONE';
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  paymentDate?: string;
  paymentMode?: string;
  razorpayPaymentId?: string;
}

export type PaymentMode = 'Razorpay UPI' | 'Razorpay Card' | 'Razorpay NetBanking' | 'Bank Transfer' | 'Cash' | 'Cheque';

export interface Payment {
  id: string;
  invoiceId?: string;
  brandId: string;
  brandName: string;
  amount: number;
  paymentDate: string;
  mode: PaymentMode;
  referenceNo: string;
  status: 'Success' | 'Pending' | 'Failed';
  proofUrl?: string;
}

export type ExpenseCategory =
  | 'Brand Expenses'
  | 'Employee Salaries'
  | 'Office Expenses'
  | 'Software & Subscriptions'
  | 'Marketing Expenses'
  | 'Other Expenses'
  | 'Salary'
  | 'Tools & Software'
  | 'Ads & Marketing'
  | 'Travel'
  | 'Office & Rent'
  | 'Freelancer Payout'
  | 'Other';

export interface Expense {
  id: string;
  title?: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentStatus?: 'Paid' | 'Pending';
  paymentMode?: string;
  brandId?: string | null;
  brandName?: string;
  employeeName?: string;
  employeeId?: string | null;
  note?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  brandId?: string;
  leadId?: string;
  date: string;
  time: string;
  durationMinutes: number;
  linkOrLocation: string;
  attendeeIds: string[];
  notes: string;
  reminderSent?: boolean;
}

export type LeadStage = 'New' | 'Contacted' | 'Proposal' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  source: string;
  stage: LeadStage;
  value: number;
  followUpDate: string;
  notes: string;
}

export type NotificationType =
  | 'assignment'
  | 'payment'
  | 'invoice'
  | 'retention'
  | 'chat'
  | 'task'
  | 'meeting'
  | 'lead'
  | 'subscription'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkModule?: string;
  brandId?: string;
  recipientRoles?: Role[];
  targetUserId?: string;
}

export interface ChatAttachment {
  name: string;
  size: string;
  url: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  readBy: string[];
  isRead?: boolean;
  isDeletedForEveryone?: boolean;
  deletedForUserIds?: string[];
  failed?: boolean;
}

export interface Conversation {
  id: string;
  type: 'brand' | 'direct' | 'team';
  title: string;
  brandId?: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherMember?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    designation?: string;
  } | null;
}

export interface Holiday {
  id: string;
  title: string;
  date: string;
  type: 'National' | 'Regional' | 'Agency Custom';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyGst: string;
  companyPan: string;
  companyState: string;
  defaultGstRate: number;
  defaultHsnSac: string;
  invoicePrefix: string;
  invoiceDesign?: any;
  bankName?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;
  razorpayKeyId: string;
  razorpayConnected: boolean;
  subscriptionPlan: {
    name: string;
    price: number;
    billingCycle: string;
    renewalDate: string;
    status: 'Active' | 'Grace Period' | 'Cancelled';
  };
  currency: string;
  currencySymbol: string;
  industry?: string;
  teamSize?: string;
  goals?: string[];
  dashboardLayout?: 'default' | 'compact' | 'expanded';
  dashboardFocus?: 'balanced' | 'financial' | 'retention';
  retentionThresholdDays: number;
  whatsappClickToShareEnabled: boolean;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
}

export interface ClientHealthScore {
  brandId: string;
  brandName: string;
  ownerName: string;
  mobile: string;
  monthlyFee: number;
  currency: string;
  currencySymbol: string;
  totalScore: number;
  tier: 'Critical' | 'Warning' | 'Stable' | 'Expansion';
  breakdown: {
    taskVelocity: { score: number; max: 25; details: string; overdueTasks: number; totalTasks: number };
    paymentHealth: { score: number; max: 25; details: string; overdueInvoices: number; totalInvoices: number };
    strategicCadence: { score: number; max: 25; details: string; daysSinceReview: number };
    clientFeedback: { score: number; max: 25; details: string; nps: number | null };
  };
  recommendation: {
    actionType: 'whatsapp_reconnect' | 'retainer_review' | 'upsell_expansion';
    title: string;
    description: string;
    suggestedMessage: string;
  };
}

export interface AgencyHealthOverview {
  overview: {
    totalClients: number;
    averageHealth: number;
    churnRisksCount: number;
    stableCount: number;
    expansionCount: number;
  };
  scores: ClientHealthScore[];
}

export interface PortalData {
  agency: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    bankDetails: {
      accountName: string;
      accountNumber: string;
      ifsc: string;
      branch: string;
      upiId: string;
    };
  };
  client: {
    id: string;
    name: string;
    ownerName: string;
    email: string;
    mobile: string;
    serviceDetails: string;
    monthlyFee: number;
    currency: string;
    currencySymbol: string;
    billingCycleDay: number;
    contractStartDate?: string;
    contractEndDate?: string;
    status: string;
    paymentStatus?: string;
    lastPaymentDate?: string;
    npsScore?: number;
    retainerHours: number;
    usedHours: number;
    hoursRemaining: number;
    hoursUtilizationPct: number;
    billingAddress?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    deliverablesScope?: DeliverableItem[];
  };
  deliverables: {
    total: number;
    completed: number;
    progressPct: number;
    items: {
      id: string;
      title: string;
      description?: string;
      status: string;
      priority: string;
      dueDate?: string;
    }[];
  };
  invoices: {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    currency: string;
    currencySymbol: string;
    notes?: string;
  }[];
}
