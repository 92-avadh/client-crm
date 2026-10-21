import React from 'react';

const StarIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.2l2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.4l-4.2 2.4 1-4.6L1.3 6l4.7-.5z" />
  </svg>
);

export const TestimonialWall: React.FC = () => {
  return (
    <section className="voices" id="voices" data-8b-section="testimonials" aria-labelledby="voices-title">
      <div className="voices__sheet m-band" aria-hidden="true" data-8b-motion="bandRise"></div>
      <div className="voices__inner l-wrap">
        <h2 className="m-text-3 voices__title" id="voices-title" data-8b-motion="captionIn">
          Recommended by agency coaches. Loved by founders who scaled with it.
        </h2>

        <div className="voices__grid">
          {/* Featured Expert */}
          <figure className="voices__expert">
            <div className="voices__photo">
              <img
                src="/images/expert-founder.jpg"
                alt="Portrait of agency founder Marcus Vance"
                loading="lazy"
                decoding="async"
              />
            </div>
            <blockquote className="voices__quote m-text-4" data-8b-motion="readAlong">
              <p>
                “I’ve watched our client churn drop from 18% down to under 2.4% within 90 days. Our account directors don’t lose sleep on Sunday nights wondering if an anchor client is about to cancel.”
              </p>
            </blockquote>
            <figcaption className="voices__who m-text-6">
              <span className="voices__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <p>
                Marcus Vance
                <br />
                <span>Managing Partner, Vance & Co (85 team members)</span>
              </p>
            </figcaption>
          </figure>

          {/* 2 Review Columns */}
          <div className="voices__cols">
            <ul className="voices__col">
              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  Set up in ten minutes and we haven’t lost a single retainer client since.
                </p>
                <p className="m-text-6">Marguerite L. · Founder, Horizon Growth</p>
              </li>

              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  We intercepted a $22,000/mo churn risk before the client even drafted their email. Small tool, massive revenue impact.
                </p>
                <p className="m-text-6">Tomás R. · CEO, Elevate Digital</p>
              </li>

              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  Live health scoring right inside Slack is a quiet little miracle for our account managers.
                </p>
                <p className="m-text-6">Daniel K. · Operations VP, ScaleWorks</p>
              </li>

              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  No lag, no manual reporting fuss, and the audit trail is right there when leadership reviews renewals.
                </p>
                <p className="m-text-6">Hannah W. · Client Director, Beacon Creative</p>
              </li>
            </ul>

            <ul className="voices__col">
              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  Retentio keeps up with our 120 client accounts effortlessly. Our net retention is 118% this year.
                </p>
                <p className="m-text-6">Evelyn C. · Managing Director, Apex Agency</p>
              </li>

              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  Ten years running agencies. This is the single most valuable retention tool we’ve ever deployed.
                </p>
                <p className="m-text-6">Ruth A. · Founder, Method & Scale</p>
              </li>

              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  Automated playbooks tailored to our agency’s voice feel completely natural to our enterprise clients.
                </p>
                <p className="m-text-6">Samuel O. · Head of Client Success, Pulse Media</p>
              </li>

              <li className="m-card">
                <p className="voices__stars" aria-label="5 out of 5 stars">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </p>
                <p className="m-text">
                  Our team checks Retentio every single morning. We are more confident, proactive, and radically less stressed.
                </p>
                <p className="m-text-6">Priya N. · Partner, North Star Advisory</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
