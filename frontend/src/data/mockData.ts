import type { User, AppSettings } from '../types';

// Only login credentials kept — all other data loads from the real backend API
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
    designation: 'Senior CA & Client Account Lead'
  },
  {
    id: 'usr_team_priya',
    name: 'Priya Sharma',
    email: 'priya.s@retentio.co',
    phone: '+91 94001 22883',
    role: 'team',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    designation: 'Growth & Social Strategy Specialist'
  },
  {
    id: 'usr_brand_vikram',
    name: 'Vikram Seth',
    email: 'vikram@apexmedia.in',
    phone: '+91 99880 11223',
    role: 'brand',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    designation: 'Co-founder & CFO, Apex Media'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  companyGst: '',
  companyPan: '',
  companyState: '',
  defaultGstRate: 18,
  defaultHsnSac: '998231',
  invoicePrefix: 'INV-',
  bankAccountName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
  upiId: '',
  razorpayKeyId: '',
  razorpayConnected: false,
  subscriptionPlan: {
    name: 'Retentio Agency Plan',
    price: 0,
    billingCycle: 'Monthly',
    renewalDate: '',
    status: 'Active'
  },
  retentionThresholdDays: 15,
  whatsappClickToShareEnabled: false
};
