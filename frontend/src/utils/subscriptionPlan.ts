import type { AppSettings } from '../types';

export type PlanTier = 'Starter' | 'Growth' | 'Scale';

export interface PlanLimits {
  tier: PlanTier;
  planName: string;
  price: number;
  status: 'Active' | 'Trial' | 'Expired';
  isTrial: boolean;
  isExpired: boolean;
  daysLeftInTrial: number;
  maxClients: number;
  maxInvoices: number;
  maxExpenses: number;
  maxTeamMembers: number;
  canAccessLeads: boolean;
  canAccessMeetings: boolean;
  canAccessWhiteLabel: boolean;
  canAccessWhatsApp: boolean;
  canAccessAICheck: boolean;
}

/**
 * Evaluates current active plan, trial dates, and limits from AppSettings
 */
export function getPlanLimits(settings?: AppSettings): PlanLimits {
  const plan = settings?.subscriptionPlan || {
    name: 'Starter',
    price: 0,
    billingCycle: 'Monthly',
    renewalDate: '',
    status: 'Active',
  };

  const rawName = (plan.name || '').toLowerCase();
  let tier: PlanTier = 'Starter';

  if (rawName.includes('scale') || plan.price >= 7000) {
    tier = 'Scale';
  } else if (rawName.includes('growth') || plan.price >= 3000) {
    tier = 'Growth';
  } else {
    tier = 'Starter';
  }

  // Evaluate trial status & expiration
  let isTrial = false;
  let isExpired = false;
  let daysLeftInTrial = 0;

  const rawStatus = (plan.status || '').toLowerCase();
  const renewalDateStr = plan.renewalDate;

  if (rawStatus.includes('trial')) {
    isTrial = true;
    if (renewalDateStr) {
      const renewal = new Date(renewalDateStr).getTime();
      const now = Date.now();
      const diffDays = Math.ceil((renewal - now) / (1000 * 60 * 60 * 24));
      daysLeftInTrial = Math.max(0, diffDays);
      if (diffDays <= 0) {
        isExpired = true;
        isTrial = false;
      }
    }
  } else if (rawStatus.includes('expire') || rawStatus.includes('cancel')) {
    isExpired = true;
  }

  // If a paid trial expired without renewal payment, downgrade active limits to Starter
  const effectiveTier: PlanTier = isExpired ? 'Starter' : tier;

  if (effectiveTier === 'Scale') {
    return {
      tier: 'Scale',
      planName: 'Scale Plan',
      price: plan.price || 7999,
      status: isTrial ? 'Trial' : isExpired ? 'Expired' : 'Active',
      isTrial,
      isExpired,
      daysLeftInTrial,
      maxClients: Infinity,
      maxInvoices: Infinity,
      maxExpenses: Infinity,
      maxTeamMembers: Infinity,
      canAccessLeads: true,
      canAccessMeetings: true,
      canAccessWhiteLabel: true,
      canAccessWhatsApp: true,
      canAccessAICheck: true,
    };
  }

  if (effectiveTier === 'Growth') {
    return {
      tier: 'Growth',
      planName: 'Growth Plan',
      price: plan.price || 3999,
      status: isTrial ? 'Trial' : isExpired ? 'Expired' : 'Active',
      isTrial,
      isExpired,
      daysLeftInTrial,
      maxClients: Infinity,
      maxInvoices: Infinity,
      maxExpenses: Infinity,
      maxTeamMembers: 10,
      canAccessLeads: true,
      canAccessMeetings: true,
      canAccessWhiteLabel: false,
      canAccessWhatsApp: false,
      canAccessAICheck: false,
    };
  }

  // Free / Starter Plan
  return {
    tier: 'Starter',
    planName: isExpired ? 'Starter (Trial Expired)' : 'Starter Free',
    price: 0,
    status: isExpired ? 'Expired' : 'Active',
    isTrial: false,
    isExpired,
    daysLeftInTrial: 0,
    maxClients: 5, // Exactly 5 clients as requested!
    maxInvoices: 2, // 2 test invoices
    maxExpenses: 5, // 5 expenses / month
    maxTeamMembers: 1, // Solo only (0 team members)
    canAccessLeads: false,
    canAccessMeetings: false,
    canAccessWhiteLabel: false,
    canAccessWhatsApp: false,
    canAccessAICheck: false,
  };
}

/**
 * Triggers official Razorpay checkout for a plan upgrade
 */
export async function openRazorpayPlanCheckout({
  tier,
  billingCycle = 'monthly',
  userName,
  userEmail,
  userPhone,
  agencyId,
  onSuccess,
  onDismiss,
}: {
  tier: 'growth' | 'scale';
  billingCycle?: 'monthly' | 'annual';
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  agencyId?: string;
  onSuccess: (paymentId: string, planData: any) => Promise<void> | void;
  onDismiss?: () => void;
}) {
  const isScale = tier === 'scale';
  const price = isScale
    ? billingCycle === 'annual' ? 6399 : 7999
    : billingCycle === 'annual' ? 3199 : 3999;

  const planName = isScale ? 'Scale Plan' : 'Growth Plan';
  const keyId = 'rzp_test_Tunrs0OKfC3PO9';

  if (typeof window === 'undefined' || !(window as any).Razorpay) {
    alert('Razorpay Checkout is currently initializing. Please try again in a few moments.');
    return;
  }

  const options = {
    key: keyId,
    amount: price * 100, // paise
    currency: 'INR',
    name: 'Retentio SaaS CRM',
    description: `${planName} Subscription (${billingCycle === 'annual' ? 'Billed Annually' : 'Monthly'})`,
    image: '/retentio-icon.png',
    notes: {
      agency_id: agencyId || '',
      plan: tier,
      billing: billingCycle,
    },
    handler: async function (response: any) {
      const renewal = new Date();
      renewal.setDate(renewal.getDate() + (billingCycle === 'annual' ? 365 : 30));

      const planData = {
        name: planName,
        price,
        billingCycle: billingCycle === 'annual' ? 'Annual' : 'Monthly',
        renewalDate: renewal.toISOString().split('T')[0],
        status: 'Active',
      };

      await onSuccess(response.razorpay_payment_id, planData);
    },
    prefill: {
      name: userName || 'Agency Admin',
      email: userEmail || 'admin@retentio.app',
      contact: userPhone || '9999999999',
    },
    theme: {
      color: '#059639',
    },
    modal: {
      ondismiss: onDismiss,
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
