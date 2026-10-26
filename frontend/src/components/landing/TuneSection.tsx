import React, { useState } from 'react';
import ScrollReveal from './ScrollReveal';

export const TuneSection: React.FC = () => {
  const [themeDark, setThemeDark] = useState(true);
  const [autoRenew, setAutoRenew] = useState(true);
  const [silenceHolidays, setSilenceHolidays] = useState(true);
  const [slackSync, setSlackSync] = useState(true);
  const [sensitivity, setSensitivity] = useState(75);
  const [riskWeight, setRiskWeight] = useState(60);

  return (
    <section className="tune" id="tune" data-8b-section="caption-styles" aria-labelledby="tune-title">
      <div className="tune__sheet m-band-2" aria-hidden="true"></div>
      <div className="tune__inner l-wrap">
        <div className="tune__body">
          <div className="tune__head">
            <h2 className="m-text-3" id="tune-title" data-8b-motion="captionIn">
              Retention rules, calibrated your way.
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
              From urgent at-risk client alerts to gentle quarterly check-ins. Retentio adapts to your agency’s client tiers, profit margins, and communication style.
            </ScrollReveal>
          </div>

          <ScrollReveal
            mode="enter"
            effect="rise"
            stagger={0.06}
            duration={0.6}
            baseOpacity={0.15}
            baseRotation={0}
            baseOffset={18}
            enableBlur
            blurStrength={3}
            as="ul"
            className="tune__settings"
          >
            <li className="tune__row">
              <h3 className="m-text-5">Health sensitivity</h3>
              <p className="m-text-8">From conservative triggers to ultra-sensitive early warnings.</p>
              <div
                className="tune__ctl tune__slider"
                data-ctl="size"
                role="slider"
                aria-label="Health sensitivity"
                aria-valuenow={sensitivity}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(10, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                  setSensitivity(pct);
                }}
              >
                <span className="tune__fill" style={{ width: `${sensitivity}%` }}></span>
                <span className="tune__thumb" style={{ left: `${sensitivity}%` }}></span>
              </div>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">Risk weight</h3>
              <p className="m-text-8">Heavier weight on payment delays vs communication latency.</p>
              <div
                className="tune__ctl tune__slider"
                data-ctl="weight"
                role="slider"
                aria-label="Risk weight"
                aria-valuenow={riskWeight}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(10, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                  setRiskWeight(pct);
                }}
              >
                <span className="tune__fill" style={{ width: `${riskWeight}%` }}></span>
                <span className="tune__thumb" style={{ left: `${riskWeight}%` }}></span>
              </div>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">Portal theme</h3>
              <p className="m-text-8">Dark obsidian, warm alabaster, or tailored to your agency brand.</p>
              <button
                type="button"
                className={`tune__ctl tune__seg ${themeDark ? 'is-dark' : 'is-light'}`}
                data-ctl="contrast"
                aria-label="Toggle Portal Theme"
                onClick={() => setThemeDark(!themeDark)}
              >
                <b className="tune__pill" style={{ left: themeDark ? '50%' : '0.25rem' }}></b>
                <span style={{ color: !themeDark ? 'var(--color-2)' : 'inherit' }}>Light</span>
                <span style={{ color: themeDark ? 'var(--color-2)' : 'inherit' }}>Dark</span>
              </button>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">AI response persona</h3>
              <p className="m-text-8">Pick the tone and speed your automated check-ins are drafted in.</p>
              <span className="tune__ctl tune__tag" aria-hidden="true">Executive Partner</span>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">One-click auto-renewals</h3>
              <p className="m-text-8">Auto-dispatches Stripe renewal invoices 30 days prior.</p>
              <button
                type="button"
                className={`tune__ctl tune__toggle ${autoRenew ? 'is-active' : ''}`}
                aria-label="Toggle One-click auto-renewals"
                aria-pressed={autoRenew}
                onClick={() => setAutoRenew(!autoRenew)}
              ></button>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">Multi-currency billing</h3>
              <p className="m-text-8">Seamlessly handles USD, EUR, GBP, and AUD client accounts.</p>
              <span className="tune__ctl tune__tag" aria-hidden="true">Auto (40+)</span>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">Silence false alarms</h3>
              <p className="m-text-8">Pause risk alerts during scheduled client company holidays.</p>
              <button
                type="button"
                className={`tune__ctl tune__toggle ${silenceHolidays ? 'is-active' : ''}`}
                aria-label="Toggle Silence false alarms"
                aria-pressed={silenceHolidays}
                onClick={() => setSilenceHolidays(!silenceHolidays)}
              ></button>
            </li>
            <li className="tune__row">
              <h3 className="m-text-5">Instant team notifications</h3>
              <p className="m-text-8">Direct high-risk alerts into dedicated private agency channels.</p>
              <button
                type="button"
                className={`tune__ctl tune__toggle ${slackSync ? 'is-active' : ''}`}
                aria-label="Toggle instant team notifications"
                aria-pressed={slackSync}
                onClick={() => setSlackSync(!slackSync)}
              ></button>
            </li>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
