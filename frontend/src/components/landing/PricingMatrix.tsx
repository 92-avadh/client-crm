import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CreditCard,
  Clock,
  Receipt
} from 'lucide-react';
import './pricing.css';

interface PricingMatrixProps {
  onSelectPlan?: (tier: string) => void;
}

export const PricingMatrix: React.FC<PricingMatrixProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showComparison, setShowComparison] = useState(false);

  // Pricing calculations: Annual gives 20% discount (~2 months free)
  const TIERS = [
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Solo & Freelance',
      icon: Sparkles,
      priceMonthly: 0,
      priceAnnual: 0,
      periodLabel: 'free forever',
      description: 'Perfect for solo consultants and freelancers managing their first client retainers.',
      isHero: false,
      popular: false,
      ctaText: 'Start Free Forever',
      microCopy: 'Free forever plan • Instant access',
      features: [
        { text: 'Up to 5 Active Clients', bold: true },
        { text: 'Unlimited Projects & Tasks', bold: false },
        { text: 'Up to 5 Expense receipts / mo', bold: false },
        { text: '2 Invoices to test billing & Razorpay', bold: false },
        { text: 'Solo Workspace (1 seat)', bold: false },
        { text: 'Basic Client Portal & Deliverables', bold: false },
        { text: 'Standard Community Support', bold: false },
      ],
      excluded: [
        'Leads CRM Pipeline',
        'Team Collaboration (No team)',
        'Meeting & Calendar sync',
        'Automated WhatsApp reminders',
        'Custom Domain & White-label',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      badge: 'Boutique Studios',
      icon: Zap,
      priceMonthly: 3999,
      priceAnnual: 3199, // ~20% off
      periodLabel: 'per month',
      description: 'For growing agencies ready to automate retainer billing, client health, and project delivery.',
      isHero: true,
      popular: true,
      popularTag: 'Most Popular for Agencies',
      ctaText: 'Start 14-Day Free Trial',
      microCopy: 'Card required for 14-day trial • Cancel anytime',
      features: [
        { text: 'Unlimited Active Clients', bold: true },
        { text: 'Up to 10 Team Members included', bold: true },
        { text: 'Unlimited Projects, Tasks & Kanban', bold: false },
        { text: 'Unlimited Recurring Invoices & Billing', bold: false },
        { text: 'Unlimited Expense tracking & ROI', bold: false },
        { text: 'Full Leads CRM Pipeline Board', bold: false },
        { text: 'Meetings & Calendar Integration', bold: false },
        { text: 'Standard Retention Health Radar', bold: false },
        { text: 'Priority Email & Chat Support', bold: false },
      ],
      excluded: [
        'White-label portal on custom domain',
        'Automated WhatsApp payment alerts',
        'Advanced AI Churn Prediction Engine',
      ],
    },
    {
      id: 'scale',
      name: 'Scale',
      badge: 'High-Growth & Enterprise',
      icon: Crown,
      priceMonthly: 7999,
      priceAnnual: 6399, // ~20% off
      periodLabel: 'per month',
      description: 'For established agencies demanding full white-labeling, AI churn prediction, and custom branding.',
      isHero: false,
      popular: false,
      ctaText: 'Upgrade to Scale',
      microCopy: 'Card required for trial • VIP onboarding',
      features: [
        { text: 'Everything in Growth, plus:', bold: true },
        { text: 'Unlimited Team Members (No seat caps)', bold: true },
        { text: '100% White-Label Portal (Custom Domain)', bold: true },
        { text: 'Remove "Powered by Retentio" badges', bold: true },
        { text: 'Automated WhatsApp & Email Reminders', bold: true },
        { text: 'Advanced AI Churn Prediction Engine', bold: true },
        { text: 'Role-Based Access Control (RBAC)', bold: false },
        { text: 'Custom Invoice Templates & Watermarks', bold: false },
        { text: 'Dedicated Account Manager & 24/7 VIP SLA', bold: false },
      ],
      excluded: [],
    },
  ];

  const COMPARISON_ROWS = [
    {
      category: 'Clients & Accounts',
      rows: [
        { feature: 'Active Retainer Clients', starter: '5 Clients', growth: 'Unlimited', scale: 'Unlimited' },
        { feature: 'Client Health Score', starter: 'Basic Score', growth: 'Standard Radar', scale: 'AI Predictive Engine' },
        { feature: 'Client Portal', starter: 'Standard Portal', growth: 'Branded Portal', scale: 'Custom Domain (portal.agency.com)' },
        { feature: 'Magic Link Passwordless Client Login', starter: 'Included', growth: 'Included', scale: 'Included' },
      ],
    },
    {
      category: 'Billing, Invoices & Finance',
      rows: [
        { feature: 'Invoices & Recurring Retainers', starter: '2 / month (Test)', growth: 'Unlimited', scale: 'Unlimited' },
        { feature: 'Razorpay & Online Payments', starter: 'Included', growth: 'Included', scale: 'Included' },
        { feature: 'Expense Tracking & Profitability', starter: '5 receipts / mo', growth: 'Unlimited', scale: 'Unlimited' },
        { feature: 'Automated Overdue Payment Reminders', starter: '—', growth: 'Email Alerts', scale: 'WhatsApp + Email Alerts' },
        { feature: 'Remove "Powered by Retentio" Watermark', starter: '—', growth: '—', scale: '100% White-Label' },
      ],
    },
    {
      category: 'Workflows & Agency Ops',
      rows: [
        { feature: 'Projects, Tasks & Kanban Milestones', starter: 'Unlimited', growth: 'Unlimited', scale: 'Unlimited' },
        { feature: 'Leads CRM Pipeline', starter: '—', growth: 'Included', scale: 'Included' },
        { feature: 'Meetings & Calendar Integration', starter: '—', growth: 'Included', scale: 'Included' },
        { feature: 'Direct Client Intake Forms', starter: '1 Form', growth: 'Unlimited', scale: 'Unlimited' },
      ],
    },
    {
      category: 'Team & Governance',
      rows: [
        { feature: 'Team Member Seats', starter: '1 (Solo)', growth: 'Up to 10 Seats', scale: 'Unlimited' },
        { feature: 'Role-Based Permissions (RBAC)', starter: 'Owner Only', growth: 'Admin / Team', scale: 'Granular Role Permissions' },
        { feature: 'Priority Onboarding & Support', starter: 'Community', growth: 'Priority Email', scale: 'Dedicated Account Manager' },
      ],
    },
  ];

  const handleAction = (tier: typeof TIERS[0]) => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('retentio_token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('retentio_user') : null;
    let currentUser: any = null;
    try {
      if (userStr) currentUser = JSON.parse(userStr);
    } catch {}

    const isLoggedIn = Boolean(token && currentUser);

    // If visitor is NOT logged in, route to signup with their chosen plan and billing cycle
    if (!isLoggedIn) {
      window.location.href = `/signup?plan=${tier.id}&billing=${billingCycle}`;
      return;
    }

    // Starter plan for logged in user
    if (tier.id === 'starter') {
      if (onSelectPlan) {
        onSelectPlan(tier.id);
      } else {
        window.location.href = '/dashboard';
      }
      return;
    }

    // Direct Razorpay test integration for LOGGED-IN users using configured credentials
    const price = billingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
    const razorpayKey = 'rzp_test_Tunrs0OKfC3PO9';

    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      try {
        const options = {
          key: razorpayKey,
          amount: price * 100, // paise
          currency: 'INR',
          name: 'Retentio SaaS CRM',
          description: `${tier.name} Plan (${billingCycle === 'annual' ? 'Billed Annually' : 'Monthly'})`,
          image: '/retentio-icon.png',
          notes: {
            agency_id: currentUser?.agencyId || '',
            plan: tier.id,
            billing: billingCycle,
          },
          handler: async function (response: any) {
            const renewal = new Date();
            renewal.setDate(renewal.getDate() + (billingCycle === 'annual' ? 365 : 30));
            const planPayload = {
              name: tier.name + ' Plan',
              price,
              billingCycle: billingCycle === 'annual' ? 'Annual' : 'Monthly',
              renewalDate: renewal.toISOString().split('T')[0],
              status: 'Active'
            };
            try {
              if (token) {
                await fetch('/api/settings', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ subscriptionPlan: planPayload, razorpayConnected: true })
                });
              }
              const stored = localStorage.getItem('retentio_settings');
              const current = stored ? JSON.parse(stored) : {};
              current.subscriptionPlan = planPayload;
              current.razorpayConnected = true;
              localStorage.setItem('retentio_settings', JSON.stringify(current));
            } catch (err) {
              console.warn('Subscription settings update notice:', err);
            }

            alert(`🎉 Payment Successful!\n\nRazorpay Payment ID: ${response.razorpay_payment_id}\n\nYour Retentio ${tier.name} Plan is now ACTIVE! All features are unlocked.`);
            if (onSelectPlan) {
              onSelectPlan(tier.id);
            } else {
              window.location.href = '/dashboard';
            }
          },
          prefill: {
            name: currentUser?.name || 'Agency Admin',
            email: currentUser?.email || 'admin@agency.com',
            contact: currentUser?.phone || '9999999999'
          },
          theme: {
            color: '#059639'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn('Razorpay checkout initialization notice:', err);
      }
    }

    // Fallback if script is loading or in headless environment
    if (onSelectPlan) {
      onSelectPlan(tier.id);
    } else {
      window.location.href = `/dashboard`;
    }
  };

  return (
    <section id="pricing" data-8b-section="pricing" className="ret-pricing-section" aria-label="Pricing & Plans">
      {/* ── Section Header ── */}
      <div className="ret-pricing-header">
        <div className="ret-pricing-kicker">
          <Sparkles size={14} />
          <span>Transparent Agency Pricing</span>
        </div>
        <h2 className="ret-pricing-title">
          Predictable Plans. Unlimited Retainer Growth.
        </h2>
        <p className="ret-pricing-subhead">
          Zero hidden seat fees. No surprise transaction taxes. Just 1 retained client pays for Retentio for a decade.
        </p>

        {/* ── Segmented Billing Toggle Pill ── */}
        <div className="ret-billing-toggle">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`ret-billing-btn ${
              billingCycle === 'monthly' ? 'ret-billing-btn--active' : 'ret-billing-btn--inactive'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`ret-billing-btn ${
              billingCycle === 'annual' ? 'ret-billing-btn--active' : 'ret-billing-btn--inactive'
            }`}
          >
            <span>Annual Billing</span>
            <span className="ret-discount-badge">Save 20%</span>
          </button>
        </div>
      </div>

      {/* ── 3-Card Grid ── */}
      <div className="ret-cards-grid">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const displayPrice = billingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
          const isHero = tier.isHero;

          return (
            <div
              key={tier.id}
              className={`ret-card ${isHero ? 'ret-card--hero' : 'ret-card--light'}`}
            >
              {/* Popular Sleek Floating Pill Badge */}
              {tier.popular && (
                <div className="ret-popular-pill">
                  <Sparkles size={12} />
                  <span>{tier.popularTag}</span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="ret-card-top">
                  <div className={`ret-card-icon ${isHero ? 'ret-card-icon--hero' : 'ret-card-icon--light'}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <span className={`ret-card-badge ${isHero ? 'ret-card-badge--hero' : 'ret-card-badge--light'}`}>
                      {tier.badge}
                    </span>
                    <h3 className={`ret-card-name ${isHero ? 'ret-card-name--hero' : 'ret-card-name--light'}`}>
                      {tier.name}
                    </h3>
                  </div>
                </div>

                <p className={`ret-card-desc ${isHero ? 'ret-card-desc--hero' : 'ret-card-desc--light'}`}>
                  {tier.description}
                </p>

                {/* Price Display */}
                <div className={`ret-price-box ${isHero ? 'ret-price-box--hero' : 'ret-price-box--light'}`}>
                  <span className={`ret-price-value ${isHero ? 'ret-price-value--hero' : 'ret-price-value--light'}`}>
                    {displayPrice === 0 ? '₹0' : `₹${displayPrice.toLocaleString('en-IN')}`}
                  </span>
                  <span className={`ret-price-cycle ${isHero ? 'ret-price-cycle--hero' : 'ret-price-cycle--light'}`}>
                    {displayPrice === 0 ? tier.periodLabel : ' / month'}
                  </span>
                  {billingCycle === 'annual' && displayPrice > 0 && (
                    <span className={`ret-price-note ${isHero ? 'ret-price-note--hero' : 'ret-price-note--light'}`}>
                      Billed yearly
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className={`ret-feat-label ${isHero ? 'ret-feat-label--hero' : 'ret-feat-label--light'}`}>
                  Included capabilities:
                </div>

                <ul className="ret-feat-list">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="ret-feat-item">
                      <div className={`ret-feat-check ${isHero ? 'ret-feat-check--hero' : 'ret-feat-check--light'}`}>
                        <Check size={12} strokeWidth={3.5} />
                      </div>
                      <span
                        className={`${feat.bold ? 'ret-feat-text--bold' : ''} ${
                          isHero ? 'ret-feat-text--hero' : 'ret-feat-text--light'
                        }`}
                      >
                        {feat.text}
                      </span>
                    </li>
                  ))}

                  {/* Excluded items */}
                  {tier.excluded.map((exc, eIdx) => (
                    <li key={`exc-${eIdx}`} className="ret-feat-item ret-feat-item--excluded">
                      <div className={`ret-feat-cross ${isHero ? 'ret-feat-cross--hero' : ''}`}>
                        ✕
                      </div>
                      <span className="ret-feat-excluded-text">
                        {exc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button & Microcopy */}
              <div>
                <button
                  type="button"
                  onClick={() => handleAction(tier)}
                  className={`ret-btn-cta ${isHero ? 'ret-btn-cta--hero' : 'ret-btn-cta--dark'}`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight size={16} />
                </button>
                <div className={`ret-card-microcopy ${isHero ? 'ret-card-microcopy--hero' : 'ret-card-microcopy--light'}`}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>{tier.microCopy}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Feature Comparison Accordion Toggle ── */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="ret-toggle-comp-btn"
        >
          <span>{showComparison ? 'Hide Detailed Comparison' : 'View Full Plans Comparison'}</span>
          {showComparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── Detailed Comparison Table ── */}
      {showComparison && (
        <div className="ret-table-wrapper">
          <div className="ret-table-header">
            <h3>Side-by-Side Feature Matrix</h3>
            <p>Everything you need to know about what's included in each tier.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ret-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Feature Capabilities</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>Starter (₹0)</th>
                  <th style={{ width: '22%', textAlign: 'center', background: '#f0fdf4', color: '#047857' }}>
                    Growth (₹3,999)
                  </th>
                  <th style={{ width: '23%', textAlign: 'center' }}>Scale (₹7,999)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((group, gIdx) => (
                  <React.Fragment key={gIdx}>
                    <tr>
                      <td colSpan={4} className="ret-table-cat">
                        {group.category}
                      </td>
                    </tr>
                    {group.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="ret-table-td-feat">{row.feature}</td>
                        <td className="ret-table-td-center">{row.starter}</td>
                        <td className="ret-table-td-hero">{row.growth}</td>
                        <td className="ret-table-td-center" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {row.scale}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Trust Indicators Bar ── */}
      <div className="ret-trust-bar">
        <div className="ret-trust-item">
          <Clock size={18} color="#059639" />
          <span>14-Day Free Trial</span>
        </div>
        <div className="ret-trust-item">
          <CreditCard size={18} color="#059639" />
          <span>Card Required For Free Trial</span>
        </div>
        <div className="ret-trust-item">
          <ShieldCheck size={18} color="#059639" />
          <span>Razorpay 256-bit Secure</span>
        </div>
        <div className="ret-trust-item">
          <Receipt size={18} color="#059639" />
          <span>GST Invoicing Ready</span>
        </div>
      </div>
    </section>
  );
};
export default PricingMatrix;
