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
          Spot unhappy clients before you lose their business.
        </h2>
        <p className="m-text-4 listen__lead" data-8b-motion="readAlong">
          Retentio scores every client from four real signals — deliverable velocity, payment health, review cadence, and NPS feedback — so you know which accounts need attention and which are ready to grow.
        </p>
      </div>

      <div className="listen__hold">
        <div className="listen__stage l-wrap">
          <div className="listen__panels">
            {/* Left Panel: What the score is built from */}
            <div className="listen__panel listen__panel--voice">
              <p className="m-text-6 listen__label">Health Score Inputs</p>
              <div className="listen__wave" aria-hidden="true">
                {waveHeights.map((h, i) => (
                  <i key={i} style={{ '--h': h } as React.CSSProperties}></i>
                ))}
              </div>
              <div className="listen__track listen__track--voice" aria-hidden="true"></div>
            </div>

            {/* Right Panel: Retentio Flags */}
            <div className="listen__panel listen__panel--read">
              <p className="m-text-6 listen__label">Retentio Flags</p>
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
                      At-risk alert: health score 42 · 31 days since last activity
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
                      Invoice INV-2026-041 is 6 days overdue · payment health dropping
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
                      Growth opportunity: score 91 · NPS 10 · ready for plan upgrade
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
