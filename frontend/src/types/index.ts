export type Role = 'admin' | 'hr' | 'team' | 'brand';

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
}

export type BrandStatus = 'Active' | 'Paused' | 'Inactive' | 'Churned';

export interface BrandDocument {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  type: string;
}

export interface Brand {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  billingAddress: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  pan?: string;
  serviceDetails: string;
  monthlyFee: number;
  billingCycleDay: number;
  onboardingDate: string;
  notes?: string;
  status: BrandStatus;
  paymentStatus?: 'Paid' | 'Pending';
  assignedMemberIds: string[];
  lastActivityDate: string;
  lastPaymentDate: string;
  documents: BrandDocument[];
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
  | 'subscription';

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
}

export interface Conversation {
  id: string;
  type: 'brand' | 'direct';
  title: string;
  brandId?: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
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
  retentionThresholdDays: number;
  whatsappClickToShareEnabled: boolean;
}
