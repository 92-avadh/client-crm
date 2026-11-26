import React, { useEffect, useState } from 'react';
import {
  X,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Building2,
  FolderKanban,
  Receipt,
  Wallet,
  CreditCard,
  HeartPulse,
  Users,
  Inbox,
  CalendarDays,
  Target,
  Settings,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';

interface GuideSlide {
  badge: string;
  heading: string;
  kind: 'meaning' | 'problem_solution' | 'controls' | 'metrics';
  summary?: string;
  problemBefore?: string;
  howSolvedNow?: string[];
  items?: Array<{ name: string; detail: string; color?: string }>;
}

interface PageGuideEntry {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  slides: GuideSlide[];
}

const PAGE_GUIDES: Record<string, PageGuideEntry> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Your daily agency summary in one screen',
    icon: <LayoutDashboard size={22} />,
    accentColor: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Dashboard?',
        kind: 'meaning',
        summary:
          'The Dashboard is your morning summary screen. Instead of checking multiple sheets, it combines your income, unpaid bills, expenses, active clients, and urgent tasks in one place.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'How it solves the old daily headache',
        kind: 'problem_solution',
        problemBefore:
          'Agency owners used to open bank apps, Excel sheets, and WhatsApp every morning just to figure out who paid, who is late, and what tasks are due today.',
        howSolvedNow: [
          'Numbers update automatically the moment a payment or task changes.',
          'Overdue invoices and pending tasks appear upfront so nothing is forgotten.',
          'Clicking any summary card takes you straight to that exact page.',
        ],
      },
      {
        badge: 'Page 3 · Top Buttons & Charts',
        heading: 'What each control on this page does',
        kind: 'controls',
        items: [
          { name: 'Customize Dashboard (Gear Icon)', detail: 'Turn sections on or off so you only see the widgets you care about.', color: '#2563eb' },
          { name: 'Chart View Switcher', detail: 'Switch between Pie, Bar, and Table views for your monthly income vs expenses.', color: '#059669' },
          { name: 'Quick Action Buttons', detail: 'Jump directly to creating a new invoice, adding a client, or logging an expense.', color: '#7c3aed' },
        ],
      },
      {
        badge: 'Page 4 · Numbers & Cards',
        heading: 'Understanding every card on the Dashboard',
        kind: 'metrics',
        items: [
          { name: 'Total Collected', detail: 'Real money received from clients so far.', color: '#10b981' },
          { name: 'Pending Collections', detail: 'Total unpaid balance from sent or overdue invoices.', color: '#f59e0b' },
          { name: 'Net Profit & Margin', detail: 'Collected revenue minus paid agency expenses.', color: '#2563eb' },
          { name: 'Pending Tasks & Activity', detail: 'Open work items for active clients and the newest updates.', color: '#6366f1' },
        ],
      },
    ],
  },
  clients: {
    title: 'Clients Directory',
    subtitle: 'Manage every client, contract & portal link',
    icon: <Building2 size={22} />,
    accentColor: '#059669',
    accentBg: 'rgba(5, 150, 105, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Clients page?',
        kind: 'meaning',
        summary:
          'This is your central address book and contract folder for every client. You save their contact person, GSTIN, billing address, monthly fee, and billing date here once.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Why saving client details once saves hours',
        kind: 'problem_solution',
        problemBefore:
          'Teams wasted time searching old emails or WhatsApp for a client’s GST number, billing address, or contract renewal date before making an invoice.',
        howSolvedNow: [
          'Every saved client auto-fills into your GST Invoice Generator in 1 click.',
          'Each client gets a private, passwordless Client Portal link to view work and invoices.',
          'Inactive or cancelled clients can be marked Inactive so they never show up in new invoices.',
        ],
      },
      {
        badge: 'Page 3 · Buttons Explained',
        heading: 'Every button on the Clients page',
        kind: 'controls',
        items: [
          { name: '+ Onboard Client', detail: 'Add a new client manually with strict mobile, pincode, GSTIN, and PAN checks.', color: '#059669' },
          { name: 'Copy Intake Link', detail: 'Copy a self-onboarding form link to send to a new client so they fill their own details.', color: '#0284c7' },
          { name: 'Status Filter & Search', detail: 'Search by client name or filter by Active, Paused, Inactive, or Lost.', color: '#6366f1' },
          { name: 'Assign Team', detail: 'Choose which staff members work on this client.', color: '#8b5cf6' },
        ],
      },
      {
        badge: 'Page 4 · Client Drawer',
        heading: 'What is inside a Client Profile?',
        kind: 'metrics',
        items: [
          { name: 'Overview & Retainer', detail: 'Monthly fee, billing day (e.g. 1st of every month), and profit margin.', color: '#10b981' },
          { name: 'Client Portal Link', detail: 'Open or copy the private link where your client views deliverables and downloads invoices.', color: '#0284c7' },
          { name: 'Contract Vault / Docs', detail: 'Upload agreements, NDAs, and KYC files with renewal dates.', color: '#f59e0b' },
        ],
      },
    ],
  },
  projects: {
    title: 'Projects & Tasks',
    subtitle: 'Track client deliverables and team deadlines',
    icon: <FolderKanban size={22} />,
    accentColor: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is Projects & Tasks?',
        kind: 'meaning',
        summary:
          'This page organizes all ongoing client work into Projects and actionable Tasks with clear owners, priorities, and due dates.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'No more forgotten client deliverables',
        kind: 'problem_solution',
        problemBefore:
          'When tasks were assigned verbally or in chat groups, deadlines slipped and clients kept asking for status updates.',
        howSolvedNow: [
          'Every task has one responsible teammate and a due date.',
          'Marking tasks Complete updates both the Client Portal and the Client Health score automatically.',
        ],
      },
      {
        badge: 'Page 3 · Controls & Views',
        heading: 'Using Projects & Tasks effectively',
        kind: 'controls',
        items: [
          { name: 'Projects vs Tasks Switch', detail: 'View high-level project timelines or drill down into individual daily tasks.', color: '#7c3aed' },
          { name: '+ Add Project / + Add Task', detail: 'Link new work to a client, pick a team member, and set priority.', color: '#059669' },
          { name: 'Status Dropdown / Checkmark', detail: 'Move work from To Do → In Progress → In Review → Completed.', color: '#0284c7' },
        ],
      },
      {
        badge: 'Page 4 · Priority & Status',
        heading: 'What the labels mean',
        kind: 'metrics',
        items: [
          { name: 'Urgent / High', detail: 'Client-facing work that needs immediate attention today.', color: '#ef4444' },
          { name: 'Medium / Low', detail: 'Scheduled work within the normal monthly retainer plan.', color: '#f59e0b' },
          { name: 'Completed', detail: 'Finished work — automatically shows as Done in the Client Portal.', color: '#10b981' },
        ],
      },
    ],
  },
  tasks: {
    title: 'Projects & Tasks',
    subtitle: 'Track client deliverables and team deadlines',
    icon: <FolderKanban size={22} />,
    accentColor: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is Projects & Tasks?',
        kind: 'meaning',
        summary:
          'Organizes all client work into Projects and individual Tasks assigned to your team with due dates and completion tracking.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Clear ownership for every deliverable',
        kind: 'problem_solution',
        problemBefore:
          'Tasks shared in messages got buried and missed, hurting client trust.',
        howSolvedNow: [
          'Every task has one owner, priority, and due date.',
          'Completed tasks update the Client Portal and Client Health score automatically.',
        ],
      },
      {
        badge: 'Page 3 · Controls',
        heading: 'Buttons on this page',
        kind: 'controls',
        items: [
          { name: '+ Add Task / Project', detail: 'Create new work linked to a client and assignee.', color: '#7c3aed' },
          { name: 'Status Selector', detail: 'Update progress between To Do, In Progress, In Review, and Completed.', color: '#0284c7' },
        ],
      },
    ],
  },
  invoices: {
    title: 'Invoices & Billing',
    subtitle: '1-click GST invoices, UPI QR codes & A4 PDFs',
    icon: <Receipt size={22} />,
    accentColor: '#0284c7',
    accentBg: 'rgba(2, 132, 199, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is Invoices & Billing?',
        kind: 'meaning',
        summary:
          'Create GST-ready invoices in seconds, switch between 4 professional invoice themes, attach your bank & UPI QR code, send payment reminders, and save clean A4 PDFs.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Faster billing with zero math mistakes',
        kind: 'problem_solution',
        problemBefore:
          'Making invoices manually in Word or Excel took 20 minutes each, caused CGST/SGST/IGST errors, and lacked easy UPI QR payment options.',
        howSolvedNow: [
          'Search and pick an active client — their address, GSTIN, and monthly fee auto-fill.',
          'GST type (CGST+SGST vs IGST) is calculated automatically using your Home State.',
          'Every invoice shows your logo, signature, company stamp, and an accurate scannable UPI QR code.',
        ],
      },
      {
        badge: 'Page 3 · Creating & Viewing Invoices',
        heading: 'Buttons inside Invoices & Preview',
        kind: 'controls',
        items: [
          { name: '+ Generate Invoice', detail: 'Opens the 1-Click Generator with searchable active clients, bank selector, and GST toggle.', color: '#0284c7' },
          { name: 'Recurring Schedule', detail: 'View or manage invoices set to auto-generate every month.', color: '#7c3aed' },
          { name: 'Preview / Eye Icon', detail: 'Opens the invoice sheet where you can switch between 4 themes and click Save PDF / Print.', color: '#059669' },
        ],
      },
      {
        badge: 'Page 4 · Collecting Payments',
        heading: 'Sending reminders & recording payments',
        kind: 'metrics',
        items: [
          { name: 'Remind Button', detail: 'Emails a polite payment reminder directly to the client.', color: '#f59e0b' },
          { name: 'WhatsApp Share', detail: 'Opens WhatsApp with a pre-filled invoice summary.', color: '#10b981' },
          { name: 'Record Payment', detail: 'Mark an invoice Paid via UPI, Bank Transfer, Cash, or Razorpay.', color: '#2563eb' },
        ],
      },
    ],
  },
  finance: {
    title: 'Finance & Payments',
    subtitle: 'Track incoming money & payment history',
    icon: <Wallet size={22} />,
    accentColor: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Finance page?',
        kind: 'meaning',
        summary:
          'Shows a complete ledger of all payments received from clients (UPI, Bank Transfer, Card, Cash) and whether each payment is cleared or pending.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Clear proof of every rupee/dollar received',
        kind: 'problem_solution',
        problemBefore:
          'Matching bank statements to client invoices manually at month-end took hours and caused missed follow-ups.',
        howSolvedNow: [
          'Every payment records the client, invoice number, date, mode, and reference ID.',
          'Confirmed payments automatically mark the matching invoice as Paid.',
        ],
      },
      {
        badge: 'Page 3 · Controls & Actions',
        heading: 'What you can do here',
        kind: 'controls',
        items: [
          { name: '+ Record Payment', detail: 'Log an offline or bank transfer payment received from a client.', color: '#10b981' },
          { name: 'Filter & Search', detail: 'Filter by payment mode or status, or search by reference number.', color: '#0284c7' },
          { name: 'Print / Export', detail: 'Print a clean payment summary for your accountant.', color: '#6366f1' },
        ],
      },
    ],
  },
  expenses: {
    title: 'Expenses Tracker',
    subtitle: 'Track salaries, software tools, ads & office costs',
    icon: <CreditCard size={22} />,
    accentColor: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Expenses page?',
        kind: 'meaning',
        summary:
          'Records everything your agency spends—team salaries, software subscriptions, ad spend, freelancer payouts, and rent—so you always know your real profit.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Revenue is not profit—track costs cleanly',
        kind: 'problem_solution',
        problemBefore:
          'High revenue can hide low margins when software tools, contractor payouts, and salaries are tracked in separate places.',
        howSolvedNow: [
          'Link expenses to a specific client or general agency overhead.',
          'Paid expenses automatically subtract from revenue to show true Net Profit on your Dashboard.',
        ],
      },
      {
        badge: 'Page 3 · Buttons & Categories',
        heading: 'Managing your expenses',
        kind: 'controls',
        items: [
          { name: '+ Add Expense', detail: 'Record a cost with category, amount, payment status, and optional receipt.', color: '#f59e0b' },
          { name: 'Category & Client Link', detail: 'Assign contractor/ad costs to a client to see that client’s exact profit margin.', color: '#0284c7' },
          { name: 'Recurring Toggle', detail: 'Mark fixed monthly expenses like office rent or software tools.', color: '#8b5cf6' },
        ],
      },
    ],
  },
  retention: {
    title: 'Client Health',
    subtitle: 'Spot unhappy clients early & keep retainers strong',
    icon: <HeartPulse size={22} />,
    accentColor: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is Client Health?',
        kind: 'meaning',
        summary:
          'Gives every active client a simple 0–100 score so you can tell at a glance who is happy and who needs a check-in call before they think about leaving.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Catch silent issues before a client cancels',
        kind: 'problem_solution',
        problemBefore:
          'Agencies usually learned a client was unhappy only when the client suddenly cancelled—when it was too late to fix.',
        howSolvedNow: [
          'Automatically checks 4 simple things (25 points each): Tasks Finished, Payments on Time, Recent Check-ins, and Client Rating.',
          'Flags any client scoring under 60 so you can message them or record a call right away.',
        ],
      },
      {
        badge: 'Page 3 · Top Controls & Cards',
        heading: 'How to read the top section',
        kind: 'controls',
        items: [
          { name: 'Needs Attention (Under 60)', detail: 'Click to filter clients with late tasks, unpaid bills, or no recent contact.', color: '#ef4444' },
          { name: 'On Track (60–84)', detail: 'Click to see healthy clients whose work and bills are running smoothly.', color: '#0284c7' },
          { name: 'Very Happy (85+)', detail: 'Click to see your happiest clients—great candidates for extra services.', color: '#10b981' },
          { name: 'Alert if quiet (7 / 15 / 30 days)', detail: 'Pick how many days of silence should trigger an inactivity reminder.', color: '#8b5cf6' },
        ],
      },
      {
        badge: 'Page 4 · Buttons on Each Client',
        heading: 'What each button on a client card does',
        kind: 'metrics',
        items: [
          { name: 'Message on WhatsApp', detail: 'Opens WhatsApp with a friendly pre-written check-in message for that client.', color: '#059669' },
          { name: 'Save Call Note', detail: 'Opens a simple box to save notes from a phone call or meeting.', color: '#0284c7' },
          { name: 'Open Client', detail: 'Takes you straight to that client’s full profile, invoices, and portal link.', color: '#6366f1' },
          { name: 'Mark Inactive (only if Under 60)', detail: 'Moves a stopped client to Inactive so they stop appearing in new invoices.', color: '#ef4444' },
        ],
      },
    ],
  },
  team: {
    title: 'Team & Permissions',
    subtitle: 'Manage staff accounts, roles & access',
    icon: <Users size={22} />,
    accentColor: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Team page?',
        kind: 'meaning',
        summary:
          'Add your staff members, assign their job roles, and choose exactly which sections of the CRM each person is allowed to see.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Safe, organized access for every teammate',
        kind: 'problem_solution',
        problemBefore:
          'Sharing one admin password exposed private revenue, salaries, and settings to everyone on the team.',
        howSolvedNow: [
          'Every teammate gets their own login with custom permissions.',
          'Designers or developers see Projects & Tasks without seeing agency bank accounts or profits.',
        ],
      },
      {
        badge: 'Page 3 · Controls & Actions',
        heading: 'Managing team members',
        kind: 'controls',
        items: [
          { name: '+ Add Member', detail: 'Create a teammate login with role presets or custom page checkboxes.', color: '#6366f1' },
          { name: 'Edit / Permissions', detail: 'Change someone’s role or toggle which sidebar pages they can access.', color: '#0284c7' },
          { name: 'Deactivate / Remove', detail: 'Pause or remove access immediately when someone leaves the team.', color: '#ef4444' },
        ],
      },
    ],
  },
  inbox: {
    title: 'Inbox & Alerts',
    subtitle: 'All updates, feedback & alerts in one feed',
    icon: <Inbox size={22} />,
    accentColor: '#0ea5e9',
    accentBg: 'rgba(14, 165, 233, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Inbox page?',
        kind: 'meaning',
        summary:
          'Collects every important event—client portal ratings, received payments, overdue invoices, and task assignments—in one clean, full-width timeline.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Never miss an important client update',
        kind: 'problem_solution',
        problemBefore:
          'Alerts were scattered across email, phone notifications, and team notes, making it easy to miss urgent feedback.',
        howSolvedNow: [
          'Every alert stays neatly grouped under Today and Earlier.',
          'Clicking any alert marks it read and takes you right to that item.',
        ],
      },
      {
        badge: 'Page 3 · Filters & Actions',
        heading: 'Using your Inbox quickly',
        kind: 'controls',
        items: [
          { name: 'Top Stat Cards', detail: 'Click Unread Updates, Important Alerts, or Today’s Activity to filter instantly.', color: '#0284c7' },
          { name: 'Category Dropdown & Search', detail: 'Filter by Payments, Invoices, Health Alerts, Tasks, or search any client name.', color: '#8b5cf6' },
          { name: 'Mark Read / Mark All Read', detail: 'Clear the blue unread dot from one item or all items at once.', color: '#10b981' },
        ],
      },
    ],
  },
  meetings: {
    title: 'Meetings Calendar',
    subtitle: 'Schedule client check-ins & review calls',
    icon: <CalendarDays size={22} />,
    accentColor: '#8b5cf6',
    accentBg: 'rgba(139, 92, 246, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Meetings page?',
        kind: 'meaning',
        summary:
          'Tracks all client review calls and team standups along with their dates, meeting links, attendees, and discussion notes.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Consistent client calls keep retainers healthy',
        kind: 'problem_solution',
        problemBefore:
          'When check-in calls weren’t scheduled in one shared place, clients went weeks without hearing from the agency.',
        howSolvedNow: [
          'Keep every upcoming client call and Google Meet/Zoom link visible to the team.',
          'Holding regular check-in meetings boosts the client’s Health Score automatically.',
        ],
      },
      {
        badge: 'Page 3 · Controls',
        heading: 'Scheduling & managing meetings',
        kind: 'controls',
        items: [
          { name: '+ Schedule Meeting', detail: 'Pick a client, date, time, duration, meeting link, and team attendees.', color: '#8b5cf6' },
          { name: 'Join Link', detail: 'Open the saved video call link in one click when it is time to meet.', color: '#0284c7' },
        ],
      },
    ],
  },
  leads: {
    title: 'Leads Pipeline',
    subtitle: 'Track sales prospects from inquiry to client',
    icon: <Target size={22} />,
    accentColor: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is the Leads Pipeline?',
        kind: 'meaning',
        summary:
          'Tracks every potential new client from first inquiry through Proposal Sent until they sign (Won) or decline (Lost).',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Stop losing warm sales inquiries',
        kind: 'problem_solution',
        problemBefore:
          'Sales leads written in notebooks or sticky notes were forgotten after the first call.',
        howSolvedNow: [
          'See each prospect’s estimated monthly value, stage, and follow-up date.',
          'Convert a Won lead into an active Client without re-typing everything.',
        ],
      },
      {
        badge: 'Page 3 · Controls & Stages',
        heading: 'Moving deals forward',
        kind: 'controls',
        items: [
          { name: '+ Add Lead', detail: 'Save a prospect’s contact person, company, phone, email, and estimated retainer.', color: '#ec4899' },
          { name: 'Stage Columns', detail: 'Track progress across New → Contacted → Proposal → Won / Lost.', color: '#0284c7' },
          { name: 'Convert to Client', detail: 'Turn a Won deal into a full client profile in one step.', color: '#10b981' },
        ],
      },
    ],
  },
  settings: {
    title: 'Workspace Settings',
    subtitle: 'Logo, signature, stamp, currency, GST & banks',
    icon: <Settings size={22} />,
    accentColor: '#64748b',
    accentBg: 'rgba(100, 116, 139, 0.12)',
    slides: [
      {
        badge: 'Page 1 · Meaning',
        heading: 'What is Workspace Settings?',
        kind: 'meaning',
        summary:
          'Your one-time setup hub for company branding (logo, signature, stamp), operating currency, GST tax rules, bank accounts + UPI QR codes, and security.',
      },
      {
        badge: 'Page 2 · Problem & Solution',
        heading: 'Set your branding & bank details once',
        kind: 'problem_solution',
        problemBefore:
          'Editing logos, signatures, tax numbers, or bank accounts on every invoice template manually led to outdated or mismatched PDFs.',
        howSolvedNow: [
          'Upload your Company Logo, Signature, and Company Stamp once — all 4 invoice themes and the Client Portal update automatically.',
          'Pick your currency and currency symbol cleanly from dropdowns.',
        ],
      },
      {
        badge: 'Page 3 · Important Tabs',
        heading: 'Where to find each setting',
        kind: 'controls',
        items: [
          { name: 'Agency Details', detail: 'Upload Company Logo, Signature, Stamp, business contact info, and Currency Symbol.', color: '#2563eb' },
          { name: 'Tax & GST', detail: 'Set your GSTIN, PAN, Home State, default SAC code, and GST percentage.', color: '#059669' },
          { name: 'Banking & Gateways', detail: 'Add up to 2 bank accounts with UPI IDs and custom UPI QR code images.', color: '#7c3aed' },
          { name: 'Invoice Design', detail: 'Choose your default invoice theme, upload logo/signature/stamp, and edit terms.', color: '#f59e0b' },
        ],
      },
    ],
  },
};

interface PageGuideModalProps {
  open: boolean;
  pageId: string;
  onClose: () => void;
}

export const PageGuideModal: React.FC<PageGuideModalProps> = ({ open, pageId, onClose }) => {
  const guide = PAGE_GUIDES[pageId] || PAGE_GUIDES.dashboard;
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    setSlideIndex(0);
  }, [pageId, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setSlideIndex((i) => Math.min(guide.slides.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setSlideIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, guide.slides.length]);

  if (!open) return null;

  const totalSlides = guide.slides.length;
  const safeIdx = Math.min(slideIndex, totalSlides - 1);
  const currentSlide = guide.slides[safeIdx];
  const isFirst = safeIdx === 0;
  const isLast = safeIdx === totalSlides - 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${guide.title} Guide`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.32)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Top Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: guide.accentBg,
                color: guide.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {guide.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: guide.accentColor }}>
                Step-by-Step Guide · {safeIdx + 1} of {totalSlides}
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {guide.title}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                {guide.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Tabs / Slide Picker */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {guide.slides.map((s, idx) => {
            const active = idx === safeIdx;
            return (
              <button
                key={s.badge}
                type="button"
                onClick={() => setSlideIndex(idx)}
                style={{
                  flex: '1 1 auto',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: active ? `1.5px solid ${guide.accentColor}` : '1px solid var(--border)',
                  background: active ? guide.accentBg : 'var(--bg-subtle)',
                  color: active ? guide.accentColor : 'var(--text-muted)',
                  fontSize: 11.5,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {idx + 1}. {s.badge.split('·')[1]?.trim() || s.badge}
              </button>
            );
          })}
        </div>

        {/* Active Slide Body */}
        <div
          key={safeIdx}
          className="animate-fade-in"
          style={{
            minHeight: 220,
            padding: 18,
            borderRadius: 14,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentSlide.kind === 'meaning' && <HelpCircle size={17} style={{ color: guide.accentColor }} />}
            {currentSlide.kind === 'problem_solution' && <CheckCircle2 size={17} style={{ color: '#10b981' }} />}
            {currentSlide.kind === 'controls' && <SlidersHorizontal size={17} style={{ color: guide.accentColor }} />}
            {currentSlide.kind === 'metrics' && <Layers size={17} style={{ color: '#f59e0b' }} />}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentSlide.heading}
            </h3>
          </div>

          {currentSlide.summary && (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {currentSlide.summary}
            </p>
          )}

          {currentSlide.kind === 'problem_solution' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 11, background: 'rgba(239, 68, 68, 0.07)', border: '1px solid rgba(239, 68, 68, 0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: '#ef4444', marginBottom: 5 }}>
                  <AlertCircle size={14} />
                  <span>The Problem Before</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {currentSlide.problemBefore}
                </p>
              </div>

              <div style={{ padding: 14, borderRadius: 11, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>
                  <CheckCircle2 size={14} />
                  <span>How This Solves It Now</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {(currentSlide.howSolvedNow || []).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {currentSlide.items && currentSlide.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentSlide.items.map((item) => (
                <div
                  key={item.name}
                  style={{
                    padding: '11px 14px',
                    borderRadius: 10,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${item.color || guide.accentColor}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slider Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button
            type="button"
            onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: isFirst ? 'not-allowed' : 'pointer',
              opacity: isFirst ? 0.45 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <ChevronLeft size={15} />
            <span>Previous</span>
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {guide.slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to guide page ${idx + 1}`}
                onClick={() => setSlideIndex(idx)}
                style={{
                  width: idx === safeIdx ? 20 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  padding: 0,
                  background: idx === safeIdx ? guide.accentColor : 'var(--border-strong, var(--border))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setSlideIndex((i) => Math.min(totalSlides - 1, i + 1))}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--solid-btn-bg, #0f172a)',
                color: 'var(--solid-btn-text, #ffffff)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
