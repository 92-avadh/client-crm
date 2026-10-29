import React from 'react';
import ScrollReveal from './ScrollReveal';

interface CallsSectionProps {
  onStartTrial?: () => void;
}

export const CallsSection: React.FC<CallsSectionProps> = ({ onStartTrial }) => {
  return (
    <section className="calls on-dark" id="calls" data-8b-section="calls" aria-labelledby="calls-title">
      <div className="calls__sheet m-band-3" aria-hidden="true" data-8b-motion="bandRise"></div>
      <div className="calls__inner l-wrap">
        <div className="calls__head">
          <h2 className="m-text-3" id="calls-title" data-8b-motion="captionIn">
            Keeping clients happy feels effortless again.
          </h2>
          <div className="calls__head-copy">
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
              className="m-text-4 calls__lead"
            >
              Working with clients should be simple, clear, and calm. With Retentio you see client deliverables, paid invoices, and upcoming renewals all in one clean place.
            </ScrollReveal>
            <a
              className="m-btn"
              href="#start"
              onClick={(e) => {
                if (onStartTrial) {
                  e.preventDefault();
                  onStartTrial();
                }
              }}
            >
              <span className="m-btn__label">Start Retaining Free</span>
              <span className="m-btn__wave" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </a>
          </div>
        </div>

        <div className="calls__grid">
          <ScrollReveal
            mode="enter"
            effect="rise"
            stagger={0.1}
            duration={0.65}
            baseOpacity={0.15}
            baseRotation={0}
            baseOffset={24}
            enableBlur
            blurStrength={3}
            as="ul"
            className="calls__list"
          >
            <li className="calls__item">
              <h3 className="m-text-5">Live account tracking, account by account</h3>
              <p className="m-text-8">
                Every team deliverable, milestone update, and paid invoice updates account status in real time so nothing slips through the cracks.
              </p>
            </li>
            <li className="calls__item">
              <h3 className="m-text-5">Works with your email, payments & team chat</h3>
              <p className="m-text-8">
                Syncs invisibly with your existing tools in 60 seconds. Your team and clients don’t change how they communicate or do work.
              </p>
            </li>
            <li className="calls__item">
              <h3 className="m-text-5">Automated playbooks or high-touch personal outreach</h3>
              <p className="m-text-8">
                Trigger automated satisfaction pulse checks or step in personally with AI-drafted executive notes tailored to their exact project history.
              </p>
            </li>
            <li className="calls__item">
              <h3 className="m-text-5">See sentiment drift before renewals arrive</h3>
              <p className="m-text-8">
                Communication changes, slow response times, and payment delays are flagged weeks before they turn into cancellation notices.
              </p>
            </li>
            <li className="calls__item">
              <h3 className="m-text-5">Audit-proof account histories</h3>
              <p className="m-text-8">
                Every client meeting, invoice, and agreement is safely saved so you never lose track of anything.
              </p>
            </li>
          </ScrollReveal>

          <div className="calls__aside">
            <div className="calls__sticky">
              <div className="calls__device">
                <figure className="phone phone--pro" aria-label="Example of a live client retention feed on Retentio">
                  {/* Hardware Edge Buttons */}
                  <span className="phone__hw-btn phone__hw-btn--silent" aria-hidden="true"></span>
                  <span className="phone__hw-btn phone__hw-btn--vol-up" aria-hidden="true"></span>
                  <span className="phone__hw-btn phone__hw-btn--vol-down" aria-hidden="true"></span>
                  <span className="phone__hw-btn phone__hw-btn--power" aria-hidden="true"></span>

                  <div className="phone__screen">
                    {/* Dynamic Island Pill */}
                    <div className="phone__island" aria-hidden="true">
                      <div className="phone__island-inner">
                        <span className="phone__camera"></span>
                        <span className="phone__sensor"></span>
                      </div>
                    </div>

                    {/* iOS Status Bar */}
                    <div className="phone__status" aria-hidden="true">
                      <span className="phone__time">9:41</span>
                      <div className="phone__indicators">
                        <span className="phone__signal">
                          <i></i><i></i><i></i><i></i>
                        </span>
                        <span className="phone__5g">5G</span>
                        <span className="phone__battery">
                          <i className="phone__battery-level"></i>
                        </span>
                      </div>
                    </div>

                    {/* App Header: Client Profile */}
                    <div className="phone__top">
                      <div className="phone__avatar-group">
                        <div className="phone__avatar">AG</div>
                        <div className="phone__who-col">
                          <div className="phone__who-row">
                            <p className="phone__who">Acme Global</p>
                            <span className="phone__tier-badge">Tier 1</span>
                          </div>
                          <p className="phone__state">
                            <span className="phone__dot" aria-hidden="true"></span>
                            Active Account · Monitored
                          </p>
                        </div>
                      </div>
                      <div className="phone__top-actions">
                        <span className="phone__call-btn" title="Live Voice Intercept Active" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Retainer Ticker Bar */}
                    <div className="phone__number" data-step="2">
                      <div className="phone__number-main">
                        <span className="phone__number-pulse"></span>
                        <strong>$14,500/mo Retainer</strong>
                      </div>
                      <span className="phone__number-status">Auto-Renews Nov 1</span>
                    </div>

                    {/* Conversation Stream */}
                    <ol className="phone__log">
                      <li className="phone__msg phone__msg--client" data-step="1">
                        <div className="phone__bubble phone__bubble--client">
                          <div className="phone__bubble-author">Marcus · VP Growth</div>
                          <p className="phone__bubble-text">
                            Hi Marcus, checking in on the Q3 growth deliverables.
                          </p>
                          <div className="phone__bubble-foot">
                            <span className="m-caption__wave" aria-hidden="true">
                              <i></i><i></i><i></i><i></i>
                            </span>
                            <span className="phone__bubble-time">10:24 AM · Team sync</span>
                          </div>
                        </div>
                      </li>

                      <li className="phone__telemetry-bar" data-step="2">
                        <div className="phone__telemetry-pill">
                          <span>Response</span>
                          <strong>12 mins</strong>
                        </div>
                        <div className="phone__telemetry-pill">
                          <span>Satisfaction</span>
                          <strong className="text-emerald-500">Positive (High)</strong>
                        </div>
                        <div className="phone__telemetry-pill">
                          <span>Renewal</span>
                          <strong>99.4%</strong>
                        </div>
                      </li>

                      <li className="phone__msg phone__msg--you" data-step="3">
                        <div className="phone__bubble phone__bubble--agency">
                          <p className="phone__bubble-text">
                            All deliverables completed 3 days early! Executive summary is live in portal.
                          </p>
                          <div className="phone__bubble-receipt">
                            <span>Seen · 10:26 AM</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M18 6L7 17l-5-5M22 10l-7.5 7.5L13 16" />
                            </svg>
                          </div>
                        </div>
                        <p className="phone__note">Sent via Portal · Verified read</p>
                      </li>

                      <li className="phone__cue" data-step="4">
                        <span className="phone__cue-icon">✨</span>
                        <span className="phone__cue-text">
                          Client Alert · High satisfaction detected · Ready for plan upgrade
                        </span>
                      </li>

                      <li className="phone__msg phone__msg--client" data-step="4">
                        <div className="phone__bubble phone__bubble--client">
                          <div className="phone__bubble-author">Marcus · VP Growth</div>
                          <p className="phone__bubble-text">
                            We’d love to add the international expansion retainer for Q4!
                          </p>
                          <div className="phone__bubble-foot">
                            <span className="phone__bubble-time">10:28 AM</span>
                          </div>
                        </div>
                      </li>

                      <li className="phone__msg phone__msg--you" data-step="5">
                        <div className="phone__bubble phone__bubble--agency">
                          <p className="phone__bubble-text">
                            Contract addendum drafted and ready in your client portal.
                          </p>
                        </div>
                      </li>
                    </ol>

                    <div className="phone__saved" data-step="5">
                      <div className="phone__saved-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div className="phone__saved-info">
                        <strong>Contract addendum synced to Stripe</strong>
                        <span>+$4,500/mo retainer updated</span>
                      </div>
                      <span className="phone__saved-badge">Active</span>
                    </div>

                    {/* Bottom App Dock */}
                    <div className="phone__bar" aria-hidden="true">
                      <span className="is-active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6" />
                        </svg>
                        Accounts
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="3" width="6" height="11" rx="3" />
                          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                        </svg>
                        Signals
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="6" width="18" height="12" rx="2" />
                          <path d="M7 10h1M11 10h1M15 10h1M8 14h8" />
                        </svg>
                        Billing
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01" />
                        </svg>
                        Playbooks
                      </span>
                    </div>

                    {/* iOS Home Indicator Pill */}
                    <div className="phone__home-indicator" aria-hidden="true"></div>
                  </div>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
