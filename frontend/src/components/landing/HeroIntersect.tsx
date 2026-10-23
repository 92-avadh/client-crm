import React from 'react';
import ScrollReveal from './ScrollReveal';

interface HeroIntersectProps {
  onStartTrial?: () => void;
}

export const HeroIntersect: React.FC<HeroIntersectProps> = ({ onStartTrial }) => {
  return (
    <section className="hero on-dark" id="hero" data-8b-section="hero" aria-labelledby="hero-title">
      <div className="hero__media">
        <img
          src="/images/hero-executive.jpg"
          width={1600}
          height={1200}
          alt="Agency team reviewing client health scores and invoicing in the Retentio dashboard"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="hero__shade" aria-hidden="true"></div>

      <div className="hero__talk" aria-hidden="true">
        <div className="hero__draw">
          <svg className="hero__lines">
            <ellipse className="hero__arc hero__arc--a" pathLength="1" />
            <ellipse className="hero__arc hero__arc--b" pathLength="1" />
            <ellipse className="hero__flow hero__flow--a" pathLength="1" />
            <ellipse className="hero__flow hero__flow--b" pathLength="1" />
          </svg>
          <div className="hero__chip hero__chip--1">
            <p className="m-caption">
              <span className="m-caption__wave">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="m-caption__text">Health score 0–100, scored per client</span>
            </p>
          </div>
          <div className="hero__chip hero__chip--2">
            <p className="m-caption">
              <span className="m-caption__wave">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="m-caption__text">At-risk accounts flagged before you lose revenue</span>
            </p>
          </div>
          <div className="hero__chip hero__chip--3">
            <p className="m-caption-2">
              <span className="m-caption__wave">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="m-caption__text">GST invoice raised · payment recorded</span>
            </p>
          </div>
        </div>
      </div>

      <div className="hero__copy l-wrap">
        <div className="hero__intro">
          <h1 className="m-text-2 hero__title" id="hero-title">
            Every client, invoice, and renewal in one workspace.
          </h1>
          <div className="hero__lower">
            <ScrollReveal
              highlightColor=""
              mode="enter"
              splitBy="words"
              effect="fade"
              stagger={0.03}
              duration={0.8}
              smoothing={0}
              baseOpacity={0.15}
              baseRotation={2}
              baseOffset={0}
              enableBlur
              blurStrength={3}
              as="p"
              className="m-text-4 hero__lead"
            >
              Retentio is the client CRM built for agencies that bill retainers. Track client happiness, raise GST-ready invoices, collect payments, and spot at-risk accounts before you lose business.
            </ScrollReveal>
            <ScrollReveal
              mode="enter"
              effect="rise"
              stagger={0.1}
              duration={0.65}
              baseOpacity={0.15}
              baseRotation={0}
              baseOffset={14}
              enableBlur
              blurStrength={2}
              as="ul"
              className="hero__proof m-text-6"
            >
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    className="hero__star"
                    d="M8 1.2l2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.4l-4.2 2.4 1-4.6L1.3 6l4.7-.5z"
                  />
                </svg>
                Health scoring across deliverables, payments, reviews &amp; NPS
              </li>
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path className="hero__tick" d="M3 8.5l3 3 7-7" />
                </svg>
                GST invoicing, recurring billing &amp; Razorpay collection
              </li>
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path className="hero__tick" d="M3 8.5l3 3 7-7" />
                </svg>
                Client portal, WhatsApp share &amp; Slack alerts
              </li>
            </ScrollReveal>
            <div className="hero__actions">
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
                <span className="m-btn__label">
                  Get started with your workspace
                </span>
                <span className="m-btn__wave" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </a>
              <a className="m-link m-text-6" href="#listen">
                See how it works
              </a>
            </div>

            {/* Mobile Hero Visual Showcase Card (shown on mobile, hidden on desktop) */}
            <div className="hero__mobile-showcase" aria-label="Retentio agency workspace overview">
              <div className="hero__mobile-card">
                <img
                  src="/images/hero-executive.jpg"
                  width={1000}
                  height={750}
                  alt="Agency team managing client retention and billing in Retentio"
                  className="hero__mobile-photo"
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="hero__mobile-shade" aria-hidden="true" />
                <div className="hero__mobile-chips">
                  <div className="hero__chip hero__chip--mob-1">
                    <p className="m-caption">
                      <span className="m-caption__wave" aria-hidden="true">
                        <i></i><i></i><i></i><i></i>
                      </span>
                      <span className="m-caption__text">Health score 98 · Live Client 360</span>
                    </p>
                  </div>
                  <div className="hero__chip hero__chip--mob-2">
                    <p className="m-caption-2">
                      <span className="m-caption__wave" aria-hidden="true">
                        <i></i><i></i><i></i><i></i>
                      </span>
                      <span className="m-caption__text">GST invoice raised · payment recorded</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
