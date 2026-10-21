import React from 'react';

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
          alt="Agency executive reviewing client portfolio performance and health analytics"
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
              <span className="m-caption__text">Client health score: 94% · Up 12pts</span>
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
              <span className="m-caption__text">Acme Corp retainer auto-renewed for Q4</span>
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
              <span className="m-caption__text">Risk alert intercepted: Playbook running</span>
            </p>
          </div>
        </div>
      </div>

      <div className="hero__copy l-wrap">
        <div className="hero__intro">
          <h1 className="m-text-2 hero__title" id="hero-title">
            Every retainer, secured before it slips.
          </h1>
          <div className="hero__lower">
            <p className="m-text-4 hero__lead">
              Retentio turns subtle client signals, payment delays, and communication tone into live retention alerts. Keep every high-value client calm, loyal, and compounding.
            </p>
            <ul className="hero__proof m-text-6">
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    className="hero__star"
                    d="M8 1.2l2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.4l-4.2 2.4 1-4.6L1.3 6l4.7-.5z"
                  />
                </svg>
                4.9 from 1,400+ agencies
              </li>
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path className="hero__tick" d="M3 8.5l3 3 7-7" />
                </svg>
                14-day free trial
              </li>
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path className="hero__tick" d="M3 8.5l3 3 7-7" />
                </svg>
                Zero setup fees
              </li>
            </ul>
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
                <span className="m-btn__label">Start Retaining Free</span>
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
          </div>
        </div>
      </div>
    </section>
  );
};
