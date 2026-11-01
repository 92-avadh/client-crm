import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getPlanLimits } from '../../utils/subscriptionPlan';
import { Sparkles, AlertTriangle, ArrowRight, X, Zap } from 'lucide-react';
import { PlanUpgradeModal } from './PlanUpgradeModal';

export const SubscriptionBanner: React.FC = () => {
  const { settings } = useApp();
  const limits = getPlanLimits(settings);
  const [dismissed, setDismissed] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState<'growth' | 'scale'>('growth');

  // Auto-launch trial upgrade if user registered with a pending trial plan
  useEffect(() => {
    try {
      const pendingStr = localStorage.getItem('retentio_pending_trial');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (pending && (pending.plan === 'growth' || pending.plan === 'scale')) {
          setTargetTier(pending.plan);
          setUpgradeModalOpen(true);
        }
        localStorage.removeItem('retentio_pending_trial');
      }
    } catch {}
  }, []);

  if (dismissed) return null;

  // 1. Trial Expired Banner
  if (limits.isExpired) {
    return (
      <>
        <div
          style={{
            background: 'linear-gradient(90deg, #b91c1c 0%, #dc2626 100%)',
            color: '#ffffff',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            zIndex: 40,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>
              <strong>7-Day Free Trial Expired:</strong> Your account is currently restricted to Starter limits (5 clients max). Complete payment to restore full agency features.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setTargetTier('growth');
                setUpgradeModalOpen(true);
              }}
              style={{
                background: '#ffffff',
                color: '#b91c1c',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>Renew with Razorpay</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <PlanUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          defaultTier={targetTier}
          title="Restore Full Agency Access"
          description="Your 7-day trial has concluded. Select a plan below to instantly reactivate unlimited client retention and agency features."
        />
      </>
    );
  }

  // 2. Active Trial Banner
  if (limits.isTrial) {
    return (
      <>
        <div
          style={{
            background: 'linear-gradient(90deg, #064e3b 0%, #059639 100%)',
            color: '#ffffff',
            padding: '8px 18px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} className="text-emerald-300" />
            <span>
              <strong>7-Day Free Trial Active:</strong> You have {limits.daysLeftInTrial} day{limits.daysLeftInTrial !== 1 ? 's' : ''} remaining on the {limits.planName}.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setTargetTier(limits.tier === 'Scale' ? 'scale' : 'growth');
                setUpgradeModalOpen(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Activate Full Subscription
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.7 }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <PlanUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          defaultTier={targetTier}
          title="Activate Full Retentio Subscription"
          description="Unlock permanent peace of mind with continuous Razorpay billing and full agency capabilities."
        />
      </>
    );
  }

  // 3. Starter Plan Subtle Banner (with 1-click Trial Upgrade)
  if (limits.tier === 'Starter') {
    return (
      <>
        <div
          style={{
            background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
            color: '#334155',
            padding: '7px 18px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            zIndex: 40,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#e2e8f0',
              color: '#0f172a',
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              STARTER
            </span>
            <span>
              Managing up to <strong>5 clients</strong> & <strong>2 invoices</strong>. Upgrade to <strong>Growth</strong> for unlimited clients, team seats & automated reminders.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setTargetTier('growth');
                setUpgradeModalOpen(true);
              }}
              style={{
                background: '#059639',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Zap size={12} />
              <span>Start 7-Day Free Trial</span>
              <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              title="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <PlanUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          defaultTier={targetTier}
          title="Upgrade to Growth or Scale"
          description="Unlock unlimited clients, team seats, leads pipeline, and automated invoice reminders."
        />
      </>
    );
  }

  return null;
};

