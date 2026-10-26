import React from 'react';
import ScrollReveal from './ScrollReveal';

export const StickyDeck: React.FC = () => {
  return (
    <section className="setup" id="setup" data-8b-section="how-it-works" aria-labelledby="setup-title">
      <div className="setup__sheet m-band-2" aria-hidden="true"></div>
      <div className="setup__inner l-wrap">
        <div className="setup__head">
          <h2 className="m-text-3" id="setup-title" data-8b-motion="captionIn">
            Three steps, then retain automatically.
          </h2>
          <ScrollReveal
            highlightColor=""
            mode="scrub"
            splitBy="words"
            effect="fade"
            stagger={0.05}
            duration={0.8}
            smoothing={0}
            baseOpacity={0.1}
            baseRotation={3}
            baseOffset={0}
            enableBlur
            blurStrength={4}
            as="p"
            className="m-text-4"
          >
            No complicated setup and zero developers required. Connect your tools in seconds and Retentio is ready before your coffee gets cold.
          </ScrollReveal>
        </div>

        <ol className="setup__steps">
          {/* Step 1: Connect */}
          <li className="setup__card" style={{ '--setup-i': 0 } as React.CSSProperties}>
            <p className="setup__num m-text-2" aria-hidden="true">
              1
            </p>
            <div className="setup__copy">
              <h3 className="m-text-5">Connect your agency tools</h3>
              <p className="m-text-8">
                One-click connect with your email, payments, and calendar. Retentio automatically organizes your client meetings, tasks, and renewal dates.
              </p>
            </div>
            <div className="setup__ui m-text-6" aria-hidden="true">
              <p className="setup__check">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12.5l2.5 2.5L16 9.5" />
                </svg>
                Stripe billing connected
              </p>
              <p className="setup__check">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12.5l2.5 2.5L16 9.5" />
                </svg>
                Team alerts connected
              </p>
              <p className="setup__check">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12.5l2.5 2.5L16 9.5" />
                </svg>
                48 client accounts imported
              </p>
            </div>
          </li>

          {/* Step 2: Configure */}
          <li className="setup__card" style={{ '--setup-i': 1 } as React.CSSProperties}>
            <p className="setup__num m-text-2" aria-hidden="true">
              2
            </p>
            <div className="setup__copy">
              <h3 className="m-text-5">Set health thresholds</h3>
              <p className="m-text-8">
                Choose your agency’s alert sensitivity, assign client relationship leads, and configure automated playbooks that fit your team’s voice.
              </p>
            </div>
            <div className="setup__ui m-text-6" aria-hidden="true">
              <p className="setup__option setup__option--on">
                Agency Standard (Score 80+)<span>Selected</span>
              </p>
              <p className="setup__option">
                High-Touch Enterprise (Score 90+)<span>1-Click Activate</span>
              </p>
            </div>
          </li>

          {/* Step 3: Retain */}
          <li className="setup__card on-dark" style={{ '--setup-i': 2 } as React.CSSProperties}>
            <p className="setup__num m-text-2" aria-hidden="true">
              3
            </p>
            <div className="setup__copy">
              <h3 className="m-text-5">Monitor, intercept & compound</h3>
              <p className="m-text-8">
                Operate with peace of mind. Retentio surfaces silent risks before clients ever mention cancelling, and automatically drafts renewal agreements.
              </p>
            </div>
            <div className="setup__ui" aria-hidden="true">
              <p className="m-caption">
                <span className="m-caption__wave">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span className="m-caption__text">Renewal agreement drafted for Acme Corp</span>
              </p>
              <p className="m-caption-2">
                <span className="m-caption__wave">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span className="m-caption__text">Signed & confirmed · +$174,000 ARR locked in</span>
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
};
