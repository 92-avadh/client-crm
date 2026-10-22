import React from 'react';

export const RoomsGallery: React.FC = () => {
  return (
    <section className="rooms on-dark" id="rooms" data-8b-section="in-person" aria-labelledby="rooms-title">
      <div className="rooms__sheet m-band-4" aria-hidden="true"></div>
      <div className="rooms__head l-wrap">
        <h2 className="m-text-3" id="rooms-title" data-8b-motion="captionIn">
          Retentio across every agency scenario.
        </h2>
        <p className="m-text-4 rooms__lead" data-8b-motion="readAlong">
          Switch to Retentio and watch your entire firm operate with total clarity — in the executive pitch, during quarterly reviews, or when a high-stakes contract renewal is on the line.
        </p>
      </div>

      <div className="rooms__hold">
        <div className="rooms__stage">
          <p className="rooms__now m-text-6">
            <i aria-hidden="true"></i>Live Intelligence · 5 Agency Scenarios
          </p>
          <div className="rooms__track">
            <svg className="rooms__lines" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="rooms__line rooms__line--a"
                pathLength="1"
                d="M0 60C40 10 80 10 120 50S200 95 240 55 320 5 360 45 440 95 480 55 560 5 600 45 680 95 720 55 800 5 840 45 920 95 1000 50"
              />
              <path
                className="rooms__line rooms__line--b"
                pathLength="1"
                d="M0 40C40 90 80 90 120 50S200 5 240 45 320 95 360 55 440 5 480 45 560 95 600 55 680 5 720 45 800 95 840 55 920 5 1000 50"
              />
            </svg>

            {/* Place 1 */}
            <figure className="rooms__place">
              <img
                src="/images/scenario-kickoff.jpg"
                alt="Agency team collaborating in an open office kickoff"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="rooms__label m-text-6">At the kickoff</figcaption>
              <div className="rooms__talk">
                <p className="m-caption">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Project plan approved & payment scheduled?</span>
                </p>
                <p className="m-caption-2">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Onboarding playbook active.</span>
                </p>
              </div>
            </figure>

            {/* Place 2 */}
            <figure className="rooms__place">
              <img
                src="/images/scenario-quarterly-review.jpg"
                alt="Client executive discussing performance analytics"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="rooms__label m-text-6">During quarterly review</figcaption>
              <div className="rooms__talk">
                <p className="m-caption">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Health score is 96% — ROI exceeded.</span>
                </p>
                <p className="m-caption-2">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Upsell approved: +$8,500/mo.</span>
                </p>
              </div>
            </figure>

            {/* Place 3 */}
            <figure className="rooms__place">
              <img
                src="/images/scenario-contract-renewal.jpg"
                alt="Agency founders in modern conference room signing contract extension"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="rooms__label m-text-6">At contract renewal</figcaption>
              <div className="rooms__talk">
                <p className="m-caption">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Auto-renewal agreement dispatched.</span>
                </p>
                <p className="m-caption-2">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Signed in 4 minutes flat.</span>
                </p>
              </div>
            </figure>

            {/* Place 4 */}
            <figure className="rooms__place">
              <img
                src="/images/scenario-leadership-standup.jpg"
                alt="Agency leadership standup reviewing account health metrics"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="rooms__label m-text-6">At leadership standup</figcaption>
              <div className="rooms__talk">
                <p className="m-caption">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Zero high-risk accounts this month.</span>
                </p>
                <p className="m-caption-2">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Agency ARR up 34% YoY.</span>
                </p>
              </div>
            </figure>

            {/* Place 5 */}
            <figure className="rooms__place">
              <img
                src="/images/scenario-urgent-escalation.jpg"
                alt="Account manager on a priority client rescue call"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="rooms__label m-text-6">During urgent escalation</figcaption>
              <div className="rooms__talk">
                <p className="m-caption">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Risk flagged early at 9:14 AM.</span>
                </p>
                <p className="m-caption-2">
                  <span className="m-caption__wave" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="m-caption__text">Account salvaged by 11:00 AM.</span>
                </p>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
};
