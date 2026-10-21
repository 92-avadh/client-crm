import React from 'react';

export const ListenPanel: React.FC = () => {
  const waveHeights = [
    0.32, 0.5, 0.74, 0.58, 0.9, 0.66, 0.42, 0.3, 0.54, 0.82, 1.0, 0.7, 0.46,
    0.36, 0.6, 0.86, 0.64, 0.4, 0.28, 0.48, 0.72, 0.94, 0.62, 0.38, 0.52,
    0.78, 0.56, 0.34,
  ];

  return (
    <section className="listen" id="listen" data-8b-section="voice-to-text" aria-labelledby="listen-title">
      <div className="listen__sheet m-band" aria-hidden="true"></div>
      <div className="listen__head l-wrap">
        <h2 className="m-text-3 listen__title" id="listen-title">
          Nothing lost between a client signal and your revenue.
        </h2>
        <p className="m-text-4 listen__lead" data-8b-motion="readAlong">
          No silent churn, no dropped balls, no blindsided cancellations. Retentio monitors engagement rhythms, payment cadences, and communication sentiment so agency teams protect every recurring dollar before risks escalate.
        </p>
      </div>

      <div className="listen__hold">
        <div className="listen__stage l-wrap">
          <div className="listen__panels">
            {/* Left Panel: Churn Signals */}
            <div className="listen__panel listen__panel--voice">
              <p className="m-text-6 listen__label">Client Signals</p>
              <div className="listen__wave" aria-hidden="true">
                {waveHeights.map((h, i) => (
                  <i key={i} style={{ '--h': h } as React.CSSProperties}></i>
                ))}
              </div>
              <div className="listen__track listen__track--voice" aria-hidden="true"></div>
            </div>

            {/* Right Panel: Retentio Intercepts */}
            <div className="listen__panel listen__panel--read">
              <p className="m-text-6 listen__label">Retentio Acts</p>
              <div className="listen__track listen__track--read">
                <div className="listen__row">
                  <p className="m-caption">
                    <span className="m-caption__wave" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="m-caption__text">
                      Warning: Client response latency exceeded 48h on Acme Corp
                    </span>
                  </p>
                </div>
                <div className="listen__row">
                  <p className="m-caption">
                    <span className="m-caption__wave" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="m-caption__text">
                      AI Alert: Negative sentiment detected in project feedback
                    </span>
                  </p>
                </div>
                <div className="listen__row">
                  <p className="m-caption">
                    <span className="m-caption__wave" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="m-caption__text">
                      Playbook running: Executive check-in call queued for 2:00 PM
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
