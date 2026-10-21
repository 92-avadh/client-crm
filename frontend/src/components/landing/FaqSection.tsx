import React from 'react';

export const FaqSection: React.FC = () => {
  return (
    <section className="faq" id="faq" data-8b-section="faq" aria-labelledby="faq-title">
      <div className="faq__sheet m-band" aria-hidden="true"></div>
      <div className="faq__inner l-wrap">
        <div className="faq__head">
          <h2 className="m-text-3" id="faq-title" data-8b-motion="captionIn">
            Questions, answered plainly.
          </h2>
          <p className="m-text-8">
            Still wondering about something?{' '}
            <a className="m-link" href="#contact">
              Ask a strategist
            </a>{' '}
            — we reply within two hours.
          </p>
        </div>

        <div className="faq__list">
          <details className="faq__item">
            <summary className="m-text-5">
              How does Retentio detect client churn before they tell us?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              Retentio continuously analyzes communication rhythms (response latency spikes), executive attendance shifts in scheduled meetings, and invoice payment cadences. Our predictive model correlates these patterns with historical agency churn data to surface actionable risk warnings weeks before an anchor client sends an offboarding notice.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              Does Retentio replace our existing CRM or work alongside it?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              It can do both. Retentio is a full-featured client retention CRM equipped with invoices, proposals, finance, and client portals, but it also integrates seamlessly with HubSpot, Salesforce, and Stripe. If you already have a sales CRM, Retentio acts as your dedicated retention and account health engine.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              How does the Stripe integration and automated retainer billing work?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              Simply connect your Stripe account with 1-click OAuth. Retentio automatically syncs active recurring subscriptions, tracks failed charges or disputes, and generates automated renewal addendums 30 days prior to contract expiration.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              Can our clients log into a branded, white-label client portal?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              Yes. Retentio provides a bespoke client portal hosted on your custom domain with your logo, color palette, and favicon. Clients can review deliverables, approve scopes, access invoices, and chat directly with your team.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              Is our agency’s client data and communications confidential and secure?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              Completely. All data is encrypted in transit and at rest using bank-grade AES-256 encryption. We never train public AI models on your private client messages or financial contracts. You own 100% of your data and can export it anytime.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              Which agency models see the highest ROI from Retentio?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              B2B service agencies, marketing and performance shops, dev agencies, fractional CFOs, and management consultancies managing 5 to 500+ recurring retainer accounts typically see an immediate 4x–12x ROI within the first quarter by salvaging just one at-risk retainer.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              Can we customize the automated playbooks and AI notifications?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              Yes. You have full control over alert triggers, notification thresholds, and AI drafting personas. Tailor responses to sound like an empathetic partner, a technical director, or a fractional executive.
            </p>
          </details>

          <details className="faq__item">
            <summary className="m-text-5">
              What happens after the 14-day free trial?
              <span className="faq__icon" aria-hidden="true"></span>
            </summary>
            <p className="m-text">
              You can choose any plan that fits your agency size. If you decide not to continue, your account simply transitions to a read-only archive with zero surprise charges.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
};
