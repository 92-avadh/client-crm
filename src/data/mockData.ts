import type {
  User,
  Brand,
  Project,
  Task,
  Invoice,
  Payment,
  Expense,
  Meeting,
  Lead,
  AppNotification,
  Conversation,
  ChatMessage,
  Holiday,
  AuditLogItem,
  AppSettings
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Alex Rivera',
    email: 'alex@retentio.co',
    phone: '+91 98765 43210',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    designation: 'Agency Founder & Managing Director'
  },
  {
    id: 'usr_hr',
    name: 'Sarah Jenkins',
    email: 'sarah.j@retentio.co',
    phone: '+91 98223 11445',
    role: 'hr',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    designation: 'Operations & Client Onboarding Manager'
  },
  {
    id: 'usr_team_rahul',
    name: 'Rahul Verma',
    email: 'rahul.v@retentio.co',
    phone: '+91 97112 88390',
    role: 'team',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    designation: 'Senior CA & Client Account Lead',
    assignedBrandIds: ['brand_apex', 'brand_zephyr']
  },
  {
    id: 'usr_team_priya',
    name: 'Priya Sharma',
    email: 'priya.s@retentio.co',
    phone: '+91 94001 22883',
    role: 'team',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    designation: 'Growth & Social Strategy Specialist',
    assignedBrandIds: ['brand_novapulse', 'brand_solis']
  },
  {
    id: 'usr_brand_vikram',
    name: 'Vikram Seth',
    email: 'vikram@apexmedia.in',
    phone: '+91 99880 11223',
    role: 'brand',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    designation: 'Co-founder & CFO, Apex Media',
    brandId: 'brand_apex'
  }
];

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand_apex',
    name: 'Apex Media Pvt Ltd',
    ownerName: 'Vikram Seth',
    mobile: '+91 99880 11223',
    email: 'accounts@apexmedia.in',
    billingAddress: '402, High Street Mall, Bandra West',
    state: 'Maharashtra',
    pincode: '400050',
    gstNumber: '27AABCA1234F1Z8',
    pan: 'AABCA1234F',
    serviceDetails: 'Monthly Retainer: Financial Auditing, GST Filing & Growth Advisory',
    monthlyFee: 125000,
    billingCycleDay: 1,
    onboardingDate: '2026-01-15',
    notes: 'Key enterprise account. Direct contact with Vikram for monthly compliance review.',
    status: 'Active',
    assignedMemberIds: ['usr_team_rahul'],
    lastActivityDate: '2026-10-02',
    lastPaymentDate: '2026-09-02',
    documents: [
      { id: 'doc_1', name: 'Master_Service_Agreement_2026.pdf', size: '2.4 MB', uploadDate: '2026-01-15', type: 'application/pdf' },
      { id: 'doc_2', name: 'GST_Registration_Certificate.pdf', size: '840 KB', uploadDate: '2026-01-16', type: 'application/pdf' }
    ]
  },
  {
    id: 'brand_zephyr',
    name: 'Zephyr Cloud Labs',
    ownerName: 'Kavita Menon',
    mobile: '+91 98450 77123',
    email: 'kavita@zephyrcloud.io',
    billingAddress: 'Indiranagar 100ft Road, Stage 2',
    state: 'Karnataka',
    pincode: '560038',
    gstNumber: '29BBBCB5678G2Z1',
    pan: 'BBBCB5678G',
    serviceDetails: 'SaaS Multi-cloud Architecture & Compliance Advisory',
    monthlyFee: 180000,
    billingCycleDay: 5,
    onboardingDate: '2026-02-10',
    notes: 'Expanding fast in Bangalore. Quarterly review on upcoming tax credits.',
    status: 'Active',
    assignedMemberIds: ['usr_team_rahul'],
    lastActivityDate: '2026-09-28',
    lastPaymentDate: '2026-09-06',
    documents: [
      { id: 'doc_3', name: 'Zephyr_Consulting_Contract.pdf', size: '1.8 MB', uploadDate: '2026-02-10', type: 'application/pdf' }
    ]
  },
  {
    id: 'brand_novapulse',
    name: 'NovaPulse D2C Healthcare',
    ownerName: 'Rohan Mehra',
    mobile: '+91 97170 33456',
    email: 'rohan@novapulse.co',
    billingAddress: 'Tower B, Cyber City, Phase 3',
    state: 'Haryana',
    pincode: '122002',
    gstNumber: '06AACCN9012H1Z5',
    pan: 'AACCN9012H',
    serviceDetails: 'Performance Marketing, Retargeting & Direct Ads Management',
    monthlyFee: 95000,
    billingCycleDay: 10,
    onboardingDate: '2026-04-01',
    notes: 'Needs proactive bi-weekly performance updates.',
    status: 'Active',
    assignedMemberIds: ['usr_team_priya'],
    lastActivityDate: '2026-09-12', // 22 days inactive - Retention Alert!
    lastPaymentDate: '2026-08-11',
    documents: [
      { id: 'doc_4', name: 'Client_Guidelines_v3.pdf', size: '4.1 MB', uploadDate: '2026-04-02', type: 'application/pdf' }
    ]
  },
  {
    id: 'brand_solis',
    name: 'Solis Renewable Solar',
    ownerName: 'Amitabh Sen',
    mobile: '+91 98300 44990',
    email: 'info@solisenergy.in',
    billingAddress: 'Salt Lake Sector V, Bidhannagar',
    state: 'West Bengal',
    pincode: '700091',
    gstNumber: '19AAACS3344J1ZQ',
    pan: 'AAACS3344J',
    serviceDetails: 'Corporate Tax, Subsidies & EPC Contract Management',
    monthlyFee: 140000,
    billingCycleDay: 15,
    onboardingDate: '2026-03-20',
    notes: 'No communication in 34 days. Extreme Churn Risk!',
    status: 'Inactive',
    assignedMemberIds: ['usr_team_priya'],
    lastActivityDate: '2026-08-30', // 35 days inactive - High Risk Alert
    lastPaymentDate: '2026-07-16',
    documents: [
      { id: 'doc_5', name: 'EPC_Tax_Audit_Report.pdf', size: '3.2 MB', uploadDate: '2026-03-22', type: 'application/pdf' }
    ]
  },
  {
    id: 'brand_urbanforge',
    name: 'UrbanForge Architecture',
    ownerName: 'Tanya Chawla',
    mobile: '+91 98110 55678',
    email: 'tanya@urbanforge.studio',
    billingAddress: 'Hauz Khas Village, Designer Row',
    state: 'Delhi',
    pincode: '110016',
    gstNumber: '07AAACU7890K1Z2',
    pan: 'AAACU7890K',
    serviceDetails: 'Complete Design Identity & Architectural Showcase',
    monthlyFee: 75000,
    billingCycleDay: 20,
    onboardingDate: '2026-05-15',
    notes: 'Project paused for redesign of corporate deck.',
    status: 'Paused',
    assignedMemberIds: [],
    lastActivityDate: '2026-09-01',
    lastPaymentDate: '2026-08-22',
    documents: []
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_apex_1',
    brandId: 'brand_apex',
    name: 'Q3 Statutory Audit & Compliance 2026',
    scope: 'Complete financial ledger review, TDS reconciliation, and filing for FY 26-27 Q3.',
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    status: 'In progress',
    assignedMemberIds: ['usr_team_rahul'],
    billingAmount: 125000,
    progress: 68
  },
  {
    id: 'proj_zephyr_1',
    brandId: 'brand_zephyr',
    name: 'SOC2 & ISO 27001 Cloud Governance Preparation',
    scope: 'Audit readiness preparation, security controls verification, and evidence documentation.',
    startDate: '2026-08-15',
    endDate: '2026-11-15',
    status: 'In progress',
    assignedMemberIds: ['usr_team_rahul'],
    billingAmount: 180000,
    progress: 45
  },
  {
    id: 'proj_novapulse_1',
    brandId: 'brand_novapulse',
    name: 'Festive Season Ad Blast & Retargeting Setup',
    scope: 'Meta & Google Ads funnel management, video assets curation, conversion tracking.',
    startDate: '2026-09-10',
    endDate: '2026-10-25',
    status: 'In progress',
    assignedMemberIds: ['usr_team_priya'],
    billingAmount: 95000,
    progress: 30
  },
  {
    id: 'proj_solis_1',
    brandId: 'brand_solis',
    name: 'Subsidy & EPC Capital Expenditure Structuring',
    scope: 'Government solar subsidy application support and EPC vendor payments review.',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'On hold',
    assignedMemberIds: ['usr_team_priya'],
    billingAmount: 140000,
    progress: 85
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_1',
    projectId: 'proj_apex_1',
    brandId: 'brand_apex',
    title: 'Reconcile GSTR-2B with Vendor Purchases for Apex Media',
    description: 'Verify all input tax credit invoices before quarterly filing window.',
    assigneeId: 'usr_team_rahul',
    dueDate: '2026-10-06',
    priority: 'Urgent',
    status: 'In Progress'
  },
  {
    id: 'task_2',
    projectId: 'proj_apex_1',
    brandId: 'brand_apex',
    title: 'Generate TDS Challan 281 for September payroll',
    description: 'Calculate 194J and 192 TDS deductions and send pay link.',
    assigneeId: 'usr_team_rahul',
    dueDate: '2026-10-07',
    priority: 'High',
    status: 'To Do'
  },
  {
    id: 'task_3',
    projectId: 'proj_zephyr_1',
    brandId: 'brand_zephyr',
    title: 'Review AWS Cloud Architecture IAM Roles & VPC Logs',
    description: 'Compile evidence for SOC-2 Type II controls matrix.',
    assigneeId: 'usr_team_rahul',
    dueDate: '2026-10-12',
    priority: 'Medium',
    status: 'To Do'
  },
  {
    id: 'task_4',
    projectId: 'proj_novapulse_1',
    brandId: 'brand_novapulse',
    title: 'Conduct Urgent Retention Call with Rohan Mehra',
    description: 'No client contact in 22 days. Discuss festive ad campaign results.',
    assigneeId: 'usr_team_priya',
    dueDate: '2026-10-05',
    priority: 'Urgent',
    status: 'To Do'
  },
  {
    id: 'task_5',
    projectId: 'proj_solis_1',
    brandId: 'brand_solis',
    title: 'Send Overdue Payment & Contract Renewal Reminder',
    description: 'Overdue invoice #INV-2026-0038 pending for 45 days.',
    assigneeId: 'usr_team_priya',
    dueDate: '2026-10-04',
    priority: 'Urgent',
    status: 'In Review'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-0041',
    brandId: 'brand_apex',
    brandName: 'Apex Media Pvt Ltd',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    items: [
      {
        id: 'item_1',
        description: 'Monthly Financial Accounting, GST Compliance & Advisory (October 2026)',
        hsnSac: '998231',
        quantity: 1,
        unitPrice: 125000,
        amount: 125000
      }
    ],
    subtotal: 125000,
    hasGst: true,
    gstType: 'CGST_SGST', // Same state (MH to MH)
    cgstAmount: 11250,
    sgstAmount: 11250,
    igstAmount: 0,
    totalAmount: 147500,
    paidAmount: 0,
    status: 'Sent',
    notes: 'Thank you for partnering with Retentio. Please settle by due date via Razorpay.'
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-2026-0039',
    brandId: 'brand_zephyr',
    brandName: 'Zephyr Cloud Labs',
    issueDate: '2026-09-05',
    dueDate: '2026-09-20',
    items: [
      {
        id: 'item_2',
        description: 'SaaS Cloud Security Governance & Audit Consulting (September 2026)',
        hsnSac: '998313',
        quantity: 1,
        unitPrice: 180000,
        amount: 180000
      }
    ],
    subtotal: 180000,
    hasGst: true,
    gstType: 'IGST', // MH to KA
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 32400,
    totalAmount: 212400,
    paidAmount: 212400,
    status: 'Paid',
    paymentDate: '2026-09-06',
    paymentMode: 'Razorpay NetBanking',
    razorpayPaymentId: 'pay_L08Xjk9s91aA2'
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-2026-0040',
    brandId: 'brand_novapulse',
    brandName: 'NovaPulse D2C Healthcare',
    issueDate: '2026-09-10',
    dueDate: '2026-09-25',
    items: [
      {
        id: 'item_3',
        description: 'Performance Marketing Retainer & Ad Optimization (September 2026)',
        hsnSac: '998361',
        quantity: 1,
        unitPrice: 95000,
        amount: 95000
      }
    ],
    subtotal: 95000,
    hasGst: true,
    gstType: 'IGST', // MH to HR
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 17100,
    totalAmount: 112100,
    paidAmount: 0,
    status: 'Overdue',
    notes: 'Second reminder generated automatically. Razorpay link active.'
  },
  {
    id: 'inv_104',
    invoiceNumber: 'INV-2026-0038',
    brandId: 'brand_solis',
    brandName: 'Solis Renewable Solar',
    issueDate: '2026-08-15',
    dueDate: '2026-08-30',
    items: [
      {
        id: 'item_4',
        description: 'Corporate Tax Subsidies Filing Retainer (August 2026)',
        hsnSac: '998231',
        quantity: 1,
        unitPrice: 140000,
        amount: 140000
      }
    ],
    subtotal: 140000,
    hasGst: true,
    gstType: 'IGST',
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 25200,
    totalAmount: 165200,
    paidAmount: 0,
    status: 'Overdue',
    notes: 'Critical overdue. Sent via WhatsApp click-to-share.'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_01',
    invoiceId: 'inv_102',
    brandId: 'brand_zephyr',
    brandName: 'Zephyr Cloud Labs',
    amount: 212400,
    paymentDate: '2026-09-06',
    mode: 'Razorpay NetBanking',
    referenceNo: 'pay_L08Xjk9s91aA2',
    status: 'Success'
  },
  {
    id: 'pay_02',
    invoiceId: 'inv_past_apex',
    brandId: 'brand_apex',
    brandName: 'Apex Media Pvt Ltd',
    amount: 147500,
    paymentDate: '2026-09-02',
    mode: 'Razorpay UPI',
    referenceNo: 'upi_ref_891729381',
    status: 'Success'
  },
  {
    id: 'pay_03',
    invoiceId: 'inv_past_nova',
    brandId: 'brand_novapulse',
    brandName: 'NovaPulse D2C Healthcare',
    amount: 112100,
    paymentDate: '2026-08-11',
    mode: 'Bank Transfer',
    referenceNo: 'NEFT_AXIS_771892',
    status: 'Success'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    category: 'Salary',
    amount: 145000,
    date: '2026-10-01',
    paymentMode: 'Bank Transfer',
    note: 'Monthly Senior CAs & Strategists staff payroll',
    isRecurring: true
  },
  {
    id: 'exp_2',
    category: 'Tools & Software',
    amount: 28500,
    date: '2026-10-02',
    paymentMode: 'Corporate Credit Card',
    note: 'Cloud servers, Zoho Books, Google Workspace, Slack enterprise',
    isRecurring: true
  },
  {
    id: 'exp_3',
    category: 'Ads & Marketing',
    amount: 45000,
    date: '2026-09-25',
    paymentMode: 'Credit Card',
    note: 'Campaign spend for Q4 agency acquisition leads',
    brandId: 'brand_novapulse'
  },
  {
    id: 'exp_4',
    category: 'Office & Rent',
    amount: 60000,
    date: '2026-10-01',
    paymentMode: 'NEFT',
    note: 'Mumbai Studio Lease & Maintenance',
    isRecurring: true
  },
  {
    id: 'exp_5',
    category: 'Freelancer Payout',
    amount: 35000,
    date: '2026-09-28',
    paymentMode: 'UPI',
    note: 'Contract cloud security audit specialist for Zephyr Cloud',
    brandId: 'brand_zephyr'
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet_1',
    title: 'Apex Media — Monthly Statutory Review & Tax Saving Strategy',
    brandId: 'brand_apex',
    date: '2026-10-05',
    time: '11:00 AM',
    durationMinutes: 45,
    linkOrLocation: 'https://meet.google.com/ret-apex-q3',
    attendeeIds: ['usr_admin', 'usr_team_rahul', 'usr_brand_vikram'],
    notes: 'Review GST audit prep, examine Q3 TDS deduction status.',
    reminderSent: true
  },
  {
    id: 'meet_2',
    title: 'NovaPulse D2C — Urgent Reconnection & Campaign Sync',
    brandId: 'brand_novapulse',
    date: '2026-10-06',
    time: '03:30 PM',
    durationMinutes: 30,
    linkOrLocation: 'https://meet.google.com/ret-nova-sync',
    attendeeIds: ['usr_admin', 'usr_team_priya'],
    notes: 'Triggered by 22-day retention alert. Goal: prevent churn.',
    reminderSent: false
  },
  {
    id: 'meet_3',
    title: 'Lead Pitch: BluePeak Logistics ERP Transition',
    leadId: 'lead_1',
    date: '2026-10-07',
    time: '04:00 PM',
    durationMinutes: 60,
    linkOrLocation: 'Agency HQ Conference Room, Bandra',
    attendeeIds: ['usr_admin', 'usr_hr'],
    notes: 'Final proposal presentation for 1.5 Lakh/mo annual retainer.',
    reminderSent: false
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead_1',
    name: 'Deepak Singhal',
    company: 'BluePeak Logistics Ltd',
    contact: 'Deepak Singhal (CEO)',
    email: 'deepak@bluepeaklogistics.in',
    phone: '+91 99100 88221',
    source: 'Referral by Zephyr Cloud',
    stage: 'Proposal',
    value: 150000,
    followUpDate: '2026-10-07',
    notes: 'Seeking complete CA, compliance & GST e-way bill automation.'
  },
  {
    id: 'lead_2',
    name: 'Aanya Sen',
    company: 'Loom & Clay Textiles',
    contact: 'Aanya Sen (Founder)',
    email: 'aanya@loomandclay.com',
    phone: '+91 98311 44550',
    source: 'Website Form',
    stage: 'Won',
    value: 85000,
    followUpDate: '2026-10-04',
    notes: 'Agreed on monthly performance marketing retainer. Ready for 1-click client onboarding!'
  },
  {
    id: 'lead_3',
    name: 'Sameer Kulkarni',
    company: 'Kulkarni Robotics & IoT',
    contact: 'Sameer Kulkarni (CTO)',
    email: 'sameer@kulkarnirobotics.com',
    phone: '+91 91234 56789',
    source: 'LinkedIn Outbound',
    stage: 'Contacted',
    value: 120000,
    followUpDate: '2026-10-09',
    notes: 'Sent introductory deck and case study on SaaS compliance.'
  },
  {
    id: 'lead_4',
    name: 'Meera Kapoor',
    company: 'Zenith Wellness Chain',
    contact: 'Meera Kapoor',
    email: 'meera@zenithwellness.in',
    phone: '+91 98400 33221',
    source: 'CA Industry Summit',
    stage: 'New',
    value: 110000,
    followUpDate: '2026-10-10',
    notes: 'Expressed interest in monthly financial reporting and tax optimization.'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'retention',
    title: '⚠️ Retention Alert: Solis Renewable Solar',
    message: 'No activity or payment from Solis Renewable Solar for 35 days. Reconnect now before churn occurs.',
    timestamp: '10 mins ago',
    isRead: false,
    linkModule: 'retention',
    brandId: 'brand_solis',
    recipientRoles: ['admin', 'team']
  },
  {
    id: 'notif_2',
    type: 'payment',
    title: '💰 Payment Received: ₹2,12,400',
    message: 'Zephyr Cloud Labs paid invoice #INV-2026-0039 successfully via Razorpay NetBanking.',
    timestamp: '2 hours ago',
    isRead: false,
    linkModule: 'invoices',
    recipientRoles: ['admin', 'hr']
  },
  {
    id: 'notif_3',
    type: 'assignment',
    title: '👤 Client Assignment Confirmed',
    message: 'Rahul Verma was assigned to Apex Media Pvt Ltd and Zephyr Cloud Labs.',
    timestamp: '1 day ago',
    isRead: true,
    linkModule: 'clients',
    recipientRoles: ['admin', 'team']
  },
  {
    id: 'notif_4',
    type: 'invoice',
    title: '📄 Invoice Overdue: NovaPulse D2C',
    message: 'Invoice #INV-2026-0040 of ₹1,12,100 is overdue by 9 days.',
    timestamp: '2 days ago',
    isRead: false,
    linkModule: 'invoices',
    brandId: 'brand_novapulse',
    recipientRoles: ['admin', 'hr']
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_apex',
    type: 'brand',
    title: 'Apex Media Client Channel',
    brandId: 'brand_apex',
    participantIds: ['usr_admin', 'usr_team_rahul', 'usr_brand_vikram'],
    lastMessage: 'All TDS challans for September have been validated and reconciled.',
    lastMessageTime: '10:42 AM',
    unreadCount: 1
  },
  {
    id: 'conv_zephyr',
    type: 'brand',
    title: 'Zephyr Cloud Labs Channel',
    brandId: 'brand_zephyr',
    participantIds: ['usr_admin', 'usr_team_rahul'],
    lastMessage: 'Razorpay confirmation receipt has been automatically attached to invoice.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0
  },
  {
    id: 'conv_team_direct',
    type: 'direct',
    title: 'Rahul Verma (Senior CA)',
    participantIds: ['usr_admin', 'usr_team_rahul'],
    lastMessage: 'Hey Alex, finished the draft for Q3 audit deliverables.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  conv_apex: [
    {
      id: 'msg_1',
      conversationId: 'conv_apex',
      senderId: 'usr_brand_vikram',
      senderName: 'Vikram Seth',
      senderRole: 'brand',
      text: 'Hi team, could you check the latest vendor purchase statements uploaded in the portal?',
      timestamp: 'Yesterday at 04:15 PM',
      readBy: ['usr_admin', 'usr_team_rahul']
    },
    {
      id: 'msg_2',
      conversationId: 'conv_apex',
      senderId: 'usr_team_rahul',
      senderName: 'Rahul Verma',
      senderRole: 'team',
      text: 'On it Vikram! I cross-checked GSTR-2B against your purchase ledgers. Everything matches except one invoice from TechServe.',
      timestamp: 'Yesterday at 04:38 PM',
      readBy: ['usr_brand_vikram', 'usr_admin']
    },
    {
      id: 'msg_3',
      conversationId: 'conv_apex',
      senderId: 'usr_brand_vikram',
      senderName: 'Vikram Seth',
      senderRole: 'brand',
      text: 'Thanks Rahul. We will ask TechServe to upload their GSTR-1. Also please send the October invoice link when ready.',
      timestamp: 'Today at 09:20 AM',
      readBy: ['usr_team_rahul']
    },
    {
      id: 'msg_4',
      conversationId: 'conv_apex',
      senderId: 'usr_admin',
      senderName: 'Alex Rivera',
      senderRole: 'admin',
      text: 'Invoice #INV-2026-0041 has been generated and is ready in your Client Portal with Razorpay instant payment support!',
      timestamp: 'Today at 10:42 AM',
      readBy: []
    }
  ],
  conv_zephyr: [
    {
      id: 'msg_5',
      conversationId: 'conv_zephyr',
      senderId: 'usr_team_rahul',
      senderName: 'Rahul Verma',
      senderRole: 'team',
      text: 'Zephyr Cloud team: AWS IAM roles audit is 100% complete.',
      timestamp: 'Yesterday at 02:10 PM',
      readBy: ['usr_admin']
    }
  ],
  conv_team_direct: [
    {
      id: 'msg_6',
      conversationId: 'conv_team_direct',
      senderId: 'usr_team_rahul',
      senderName: 'Rahul Verma',
      senderRole: 'team',
      text: 'Hey Alex, finished the draft for Q3 audit deliverables. Ready for your review.',
      timestamp: 'Yesterday at 05:45 PM',
      readBy: ['usr_admin']
    }
  ]
};

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol_1', title: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'National' },
  { id: 'hol_2', title: 'Dussehra (Vijayadashami)', date: '2026-10-20', type: 'National' },
  { id: 'hol_3', title: 'Diwali (Deepavali)', date: '2026-11-08', type: 'National' },
  { id: 'hol_4', title: 'Govardhan Puja', date: '2026-11-09', type: 'Regional' },
  { id: 'hol_5', title: 'Bhai Dooj', date: '2026-11-10', type: 'Regional' },
  { id: 'hol_6', title: 'Agency Annual Hackathon & Rest Day', date: '2026-10-16', type: 'Agency Custom' }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud_1',
    timestamp: '2026-10-04 11:30:15',
    actorName: 'Alex Rivera',
    actorRole: 'Admin',
    action: 'Invoice Created',
    details: 'Generated #INV-2026-0041 for Apex Media Pvt Ltd (₹1,47,500 with GST).',
    ipAddress: '103.21.124.50'
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-03 16:45:22',
    actorName: 'Sarah Jenkins',
    actorRole: 'HR / Manager',
    action: 'Team Assigned',
    details: 'Assigned Rahul Verma to Zephyr Cloud Labs and Apex Media.',
    ipAddress: '103.21.124.52'
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-02 09:12:08',
    actorName: 'Vikram Seth',
    actorRole: 'Client',
    action: 'Client Portal Login',
    details: 'Logged into Apex Media Client Portal from Bandra, Mumbai.',
    ipAddress: '49.36.18.112'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'KORVEX Financial & Growth Advisors LLP',
  companyEmail: 'billing@korvex.in',
  companyPhone: '+91 22 6123 9000',
  companyAddress: 'Suite 901, Signature Corporate Towers, BKC, Bandra East, Mumbai, Maharashtra 400051',
  companyGst: '27AAACK1234M1Z9',
  companyPan: 'AAACK1234M',
  companyState: 'Maharashtra',
  defaultGstRate: 18,
  defaultHsnSac: '998231',
  invoicePrefix: 'INV-2026-',
  bankAccountName: 'KORVEX Financial Advisors LLP',
  bankAccountNumber: '924020054321987',
  bankIfsc: 'HDFC0000123',
  bankBranch: 'BKC Executive Branch, Mumbai',
  upiId: 'korvexadvisors@okhdfcbank',
  razorpayKeyId: 'rzp_live_9aKs91A20xLe81',
  razorpayConnected: true,
  subscriptionPlan: {
    name: 'Retentio Enterprise Agency Plan',
    price: 3499,
    billingCycle: 'Monthly',
    renewalDate: '2026-11-01',
    status: 'Active'
  },
  retentionThresholdDays: 15,
  whatsappClickToShareEnabled: true
};
