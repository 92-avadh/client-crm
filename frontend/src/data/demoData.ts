import type { Brand, User, Project, Task, Invoice, Payment, Expense, Meeting, Lead } from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Alex Rivera',
    email: 'alex@retentio.co',
    phone: '+91 98765 43210',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    designation: 'Agency Founder & Managing Director',
    assignedBrandIds: [],
  },
  {
    id: 'usr_hr',
    name: 'Sarah Jenkins',
    email: 'sarah.j@retentio.co',
    phone: '+91 98223 11445',
    role: 'hr',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    designation: 'Operations & Client Onboarding Manager',
    assignedBrandIds: [],
  },
  {
    id: 'usr_team_rahul',
    name: 'Rahul Verma',
    email: 'rahul.v@retentio.co',
    phone: '+91 97112 88390',
    role: 'team',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    designation: 'Senior Account Lead & Strategist',
    assignedBrandIds: [],
  },
  {
    id: 'usr_team_priya',
    name: 'Priya Sharma',
    email: 'priya.s@retentio.co',
    phone: '+91 94001 22883',
    role: 'team',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    designation: 'Growth & Social Strategy Specialist',
    assignedBrandIds: [],
  },
];

export const DEMO_BRANDS: Brand[] = [];
export const DEMO_PROJECTS: Project[] = [];
export const DEMO_TASKS: Task[] = [];
export const DEMO_INVOICES: Invoice[] = [];
export const DEMO_PAYMENTS: Payment[] = [];
export const DEMO_EXPENSES: Expense[] = [];
export const DEMO_MEETINGS: Meeting[] = [];
export const DEMO_LEADS: Lead[] = [];
