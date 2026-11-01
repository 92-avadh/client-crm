import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { openRazorpayPlanCheckout } from '../../utils/subscriptionPlan';
import { Check, X, Zap, Crown, ArrowRight, ShieldCheck } from 'lucide-react';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  defaultTier?: 'growth' | 'scale';
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'Upgrade Your Retentio Plan',
  description = 'Expand your client capacity, team collaboration, and automated billing features.',
  defaultTier = 'growth',
}) => {
  const { currentUser, updateSettings, showToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (tier: 'growth' | 'scale') => {
    setLoadingTier(tier);
    try {
      await openRazorpayPlanCheckout({
        tier,
        billingCycle,
        userName: currentUser?.name,
        userEmail: currentUser?.email,
        agencyId: currentUser?.agencyId,
        onSuccess: async (paymentId, planData) => {
          try {
            await updateSettings({
              subscriptionPlan: planData,
              razorpayConnected: true,
            });
            showToast(`🎉 Plan upgraded to ${planData.name}! All features unlocked. (Payment: ${paymentId})`, 'success');
            onClose();
          } catch (err: any) {
            showToast(err?.message || 'Payment recorded, updating settings...', 'info');
            onClose();
          }
        },
        onDismiss: () => {
          setLoadingTier(null);
        },
      });
    } catch (e: any) {
      showToast(e?.message || 'Payment checkout could not be opened', 'error');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: 24,
          maxWidth: 780,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border, #e2e8f0)',
          position: 'relative',
          padding: '28px 24px',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'var(--bg-subtle, #f1f5f9)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary, #64748b)',
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, paddingRight: 24, paddingLeft: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>

          {/* Billing Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 9999,
              background: 'var(--bg-subtle, #f1f5f9)',
              border: '1px solid var(--border, #e2e8f0)',
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: billingCycle === 'monthly' ? '#0f172a' : 'transparent',
                color: billingCycle === 'monthly' ? '#ffffff' : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: billingCycle === 'annual' ? '#0f172a' : 'transparent',
                color: billingCycle === 'annual' ? '#ffffff' : '#64748b',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: 9999,
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 2 Paid Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Growth Plan Card */}
          <div
            style={{
              borderRadius: 20,
              padding: 24,
              border: '2px solid rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(180deg, #091e15 0%, #04120c 100%)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 12px 28px -8px rgba(4, 30, 20, 0.35)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <Zap size={20} />
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#34d399' }}>
                    Most Popular for Agencies
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#ffffff' }}>Growth Plan</h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace' }}>
                  ₹{billingCycle === 'annual' ? '3,199' : '3,999'}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>/ month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                  <Check size={14} color="#34d399" strokeWidth={3} />
                  <strong>Unlimited Active Clients</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                  <Check size={14} color="#34d399" strokeWidth={3} />
                  <strong>Up to 10 Team Members</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                  <Check size={14} color="#34d399" strokeWidth={3} />
                  Unlimited Recurring Invoices & Expenses
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                  <Check size={14} color="#34d399" strokeWidth={3} />
                  Full Leads CRM Pipeline Board
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                  <Check size={14} color="#34d399" strokeWidth={3} />
                  Meetings & Calendar Sync
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={loadingTier === 'growth'}
              onClick={() => handleSelectPlan('growth')}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 12,
                background: '#10b981',
                color: '#022c22',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              <span>{loadingTier === 'growth' ? 'Connecting Razorpay...' : 'Upgrade to Growth'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Scale Plan Card */}
          <div
            style={{
              borderRadius: 20,
              padding: 24,
              border: '1.5px solid var(--border, #e2e8f0)',
              background: 'var(--bg-subtle, #f8fafc)',
              color: 'var(--text-primary, #0f172a)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                  }}
                >
                  <Crown size={20} />
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#d97706' }}>
                    Scale & White-Label
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Scale Plan</h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace' }}>
                  ₹{billingCycle === 'annual' ? '6,399' : '7,999'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>/ month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color="#059639" strokeWidth={3} />
                  <strong>Unlimited Team Seats (No Caps)</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color="#059639" strokeWidth={3} />
                  <strong>100% White-Label (Custom Domain)</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color="#059639" strokeWidth={3} />
                  Remove "Powered by Retentio" badges
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color="#059639" strokeWidth={3} />
                  Automated WhatsApp Alerts & Reminders
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color="#059639" strokeWidth={3} />
                  Full AI Churn Engine & Dedicated SLA
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={loadingTier === 'scale'}
              onClick={() => handleSelectPlan('scale')}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 12,
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>{loadingTier === 'scale' ? 'Connecting Razorpay...' : 'Upgrade to Scale'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Test Payment via Razorpay Test Key (rzp_test_Tunrs0OKfC3PO9) • Instant Activation</span>
        </div>
      </div>
    </div>
  );
};

