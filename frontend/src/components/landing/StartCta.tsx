import React from 'react';
import ScrollReveal from './ScrollReveal';

interface StartCtaProps {
  onStartTrial?: () => void;
}

export const StartCta: React.FC<StartCtaProps> = ({ onStartTrial }) => {
  return (
    <section className="start on-dark" id="start" data-8b-section="call-to-action" aria-labelledby="start-title">
      <div className="start__sheet m-band-4" aria-hidden="true"></div>
      <div className="start__inner l-wrap">
        <div className="start__window">
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            srcSet="
              https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80 640w,
              https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1180&q=80 1180w,
              https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80 1600w
            "
            sizes="(max-width: 767px) 269vw, 92vw"
            width={1600}
            height={1067}
            alt="Agency leadership team smiling and celebrating client operations success"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="start__copy">
          <h2 className="m-text-3" id="start-title">
            Your next retainer renewal can be the easiest one yet.
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
            Free 14-day trial. Zero setup fees. Live in five minutes with your current agency stack.
          </ScrollReveal>
          <div className="start__actions">
            <a
              className="m-btn"
              href="#hero"
              onClick={(e) => {
                if (onStartTrial) {
                  e.preventDefault();
                  onStartTrial();
                }
              }}
            >
              <span className="m-btn__label">Get Retentio Free</span>
              <span className="m-btn__wave" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </a>
            <a className="m-link m-text-6" href="#contact">
              Talk to an agency strategist
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
