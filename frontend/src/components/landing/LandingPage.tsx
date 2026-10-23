import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { LandingNav } from './LandingNav';
import { HeroIntersect } from './HeroIntersect';
import { ListenPanel } from './ListenPanel';
import { CallsSection } from './CallsSection';
import { RoomsGallery } from './RoomsGallery';
import { TestimonialWall } from './TestimonialWall';
import { StickyDeck } from './StickyDeck';
import { FaqSection } from './FaqSection';
import { StartCta } from './StartCta';
import { ContactSection } from './ContactSection';
import { LandingFooter } from './LandingFooter';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  isLoggedIn?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isLoggedIn: isLoggedInProp = false }) => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = isLoggedInProp || (typeof window !== 'undefined' && Boolean(
    localStorage.getItem('retentio_user') && (localStorage.getItem('retentio_token') || localStorage.getItem('retentio_bypass_mode') === 'true')
  ));

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Retentio — Client Retention CRM & Recurring Revenue Operating System';

    // Measure nav bar height
    const measureNav = () => {
      const bar = document.querySelector('#nav .nav__bar');
      if (bar) {
        document.documentElement.style.setProperty(
          '--page-nav-h',
          `${Math.ceil(bar.getBoundingClientRect().bottom + 12)}px`
        );
      }
    };
    measureNav();
    window.addEventListener('resize', measureNav);

    // Check user preference for reduced motion or touch mobile device
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchMobile = typeof window !== 'undefined' && (
      window.innerWidth <= 980 ||
      window.matchMedia('(pointer: coarse)').matches
    );

    // Initialize Lenis smooth scroll on desktop mouse devices only
    // Mobile touch devices use native 120Hz momentum scrolling to prevent stuck scroll / gesture traps
    let lenis: Lenis | null = null;
    let tickerCb: ((time: number) => void) | null = null;

    if (!prefersReducedMotion && !isTouchMobile) {
      lenis = new Lenis({
        lerp: 0.14,         // Responsive and natural - eliminates sluggish artificial scrolling delays
        smoothWheel: true,
        syncTouch: false,   // Never hijack touch scrolling on mobile/tablets
        wheelMultiplier: 1,
        touchMultiplier: 1,
      });

      (window as any).lenis = lenis;
      (window as any).ScrollTrigger = ScrollTrigger;

      const onScroll = () => {
        ScrollTrigger.update();
      };
      lenis.on('scroll', onScroll);

      tickerCb = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);
    } else {
      // Passive native scroll listener so ScrollTrigger updates smoothly on touch mobile
      ScrollTrigger.config({ limitCallbacks: true });
      const handleNativeScroll = () => {
        ScrollTrigger.update();
      };
      window.addEventListener('scroll', handleNativeScroll, { passive: true });
    }

    // Intercept in-page anchor links for seamless coordinated Lenis scrolling
    const handleHashClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#' || hash === '#main') return;
      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target as HTMLElement, { offset: -24, duration: 0.85 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    document.addEventListener('click', handleHashClick);

    // GSAP Scroll Animations
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 0. Section Transition Sheets: Solid architectural stability without translucent bleed or clipping
      // Section content reveals smoothly via coordinated scroll triggers below

      // 1. Coordinated Section Headings
      const sectionHeads = [
        { trigger: '#listen .listen__head', targets: '#listen .listen__title' },
        { trigger: '#calls .calls__head', targets: '#calls .calls__head h2, #calls .calls__head .m-btn' },
        { trigger: '#tune .tune__head', targets: '#tune .tune__head h2' },
        { trigger: '#rooms .rooms__head', targets: '#rooms .rooms__head h2' },
        { trigger: '#voices .voices__inner', targets: '#voices .voices__title' },
        { trigger: '#setup .setup__head', targets: '#setup .setup__head h2' },
        { trigger: '#faq .faq__head', targets: '#faq .faq__head h2, #faq .faq__head p' },
        { trigger: '#start .start__copy', targets: '#start .start__copy h2, #start .start__actions' },
        { trigger: '#contact .contact__inner', targets: '#contact .contact__info > h2' },
      ];

      sectionHeads.forEach((sec, idx) => {
        const triggerEl = document.querySelector(sec.trigger);
        const targetEls = document.querySelectorAll(sec.targets);
        if (triggerEl && targetEls.length > 0) {
          gsap.fromTo(
            targetEls,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                id: `head:reveal-${idx}`,
                trigger: triggerEl,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }
      });

      // 2. Listen Section Staging, Wave Swell & Alert Rows
      const listenRoot = document.getElementById('listen');
      const listenHold = document.querySelector('#listen .listen__hold');
      const listenBars = document.querySelectorAll('#listen .listen__wave > i');
      const listenRows = document.querySelectorAll('#listen .listen__row');

      if (listenRoot && listenHold) {
        listenRoot.classList.add('is-staged');

        gsap.fromTo(
          '#listen .listen__panel--voice',
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              id: 'listen:panel-voice',
              trigger: '#listen .listen__hold',
              start: 'top 82%',
              once: true,
            },
          }
        );

        gsap.fromTo(
          '#listen .listen__panel--read',
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              id: 'listen:panel-read',
              trigger: '#listen .listen__hold',
              start: 'top 82%',
              once: true,
            },
          }
        );

        if (listenBars.length > 0) {
          ScrollTrigger.create({
            id: 'listen:waves',
            trigger: '#listen .listen__hold',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              const swell = Math.sin(Math.PI * progress);
              listenBars.forEach((bar, idx) => {
                const s = 1 - swell * 0.6 * (1 - Math.abs(Math.sin(idx * 0.45 + progress * 15)));
                gsap.set(bar, { scaleY: s });
              });
            },
          });
        }
      }

      // 3. Calls Section - Feature List Stagger & Device Steps
      const callsRoot = document.getElementById('calls');
      const callItems = document.querySelectorAll('#calls .calls__item');

      if (callsRoot && callItems.length > 0) {
        const itemsArr = Array.from(callItems) as HTMLElement[];
        const stepsArr = itemsArr.map((_, i) =>
          Array.from(document.querySelectorAll<HTMLElement>(`#calls .phone [data-step="${i + 1}"]`))
        );

        const callTimeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'calls:steps',
            trigger: itemsArr[0],
            start: 'top 55%',
            endTrigger: itemsArr[itemsArr.length - 1],
            end: 'bottom 55%',
            scrub: true,
          },
        });

        itemsArr.forEach((item, index) => {
          if (index > 0) {
            callTimeline.fromTo(item, { opacity: 0.35 }, { opacity: 1, duration: 0.25 }, index - 0.1);
          }
          if (index < itemsArr.length - 1) {
            callTimeline.to(item, { opacity: 0.35, duration: 0.25 }, index + 0.9);
          }
          if (stepsArr[index]?.length) {
            // Keep Step 1 visible initially so the phone interface is never blank
            if (index > 0) {
              callTimeline.from(
                stepsArr[index],
                {
                  opacity: 0,
                  y: 14,
                  scale: 0.96,
                  duration: 0.3,
                  stagger: 0.12,
                  ease: 'power2.out',
                },
                index + 0.05
              );
            }
          }
        });

        // Polished device exit without unnatural rotation or extreme translation
        gsap.timeline({
          defaults: { ease: 'power1.out' },
          scrollTrigger: {
            id: 'calls:exit',
            trigger: '#calls',
            start: 'bottom bottom',
            end: 'bottom 20%',
            scrub: true,
          },
        }).to('#calls .calls__device', { scale: 0.95, y: -20, opacity: 0.75 }, 0);
      }

      // 4. Tune Section Typography & Calibration Settings
      const tuneRoot = document.getElementById('tune');
      const tuneRows = document.querySelectorAll('#tune .tune__settings .tune__row');

      // 5. Rooms Horizontal Scroll Track & Gallery Stagger
      const roomsRoot = document.getElementById('rooms');
      const roomsTrack = document.querySelector('#rooms .rooms__track') as HTMLElement | null;
      const roomCards = document.querySelectorAll('#rooms .rooms__place');

      if (roomsRoot && roomsTrack) {
        roomsRoot.classList.add('is-track');
        const travel = () => Math.max(0, roomsTrack.scrollWidth - window.innerWidth + 80);
        roomsRoot.style.setProperty('--rooms-travel', `${travel()}px`);

        if (roomCards.length > 0) {
          gsap.fromTo(
            roomCards,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                id: 'rooms:cards',
                trigger: '#rooms .rooms__stage',
                start: 'top 80%',
                once: true,
              },
            }
          );
        }

        const roomsTl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'rooms:horizontal',
            trigger: '#rooms .rooms__hold',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        roomsTl.fromTo(roomsTrack, { x: 0 }, { x: () => -travel(), duration: 1 }, 0);
        roomsTl.fromTo(
          '#rooms .rooms__line',
          { strokeDasharray: 1, strokeDashoffset: 0.8 },
          { strokeDashoffset: 0, duration: 1 },
          0
        );
      }

      // 6. Testimonial Wall - Expert Quote & Staggered Review Cards
      const voicesRoot = document.getElementById('voices');
      const expertCard = document.querySelector('#voices .voices__expert');
      const reviewCards = document.querySelectorAll('#voices .voices__col .m-card');

      if (voicesRoot) {
        if (expertCard) {
          gsap.fromTo(
            expertCard,
            { opacity: 0, y: 22 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: {
                id: 'voices:expert',
                trigger: expertCard,
                start: 'top 82%',
                once: true,
              },
            }
          );
        }

      }

      // 7. Setup Stacking Cards
      const setupRoot = document.getElementById('setup');
      const setupCards = document.querySelectorAll('#setup .setup__card');

      if (setupRoot && setupCards.length > 0) {
        setupRoot.classList.add('is-stacked');
        const cardsArr = Array.from(setupCards) as HTMLElement[];

        gsap.fromTo(
          cardsArr,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              id: 'setup:intro',
              trigger: '#setup .setup__steps',
              start: 'top 82%',
              once: true,
            },
          }
        );

        cardsArr.slice(0, -1).forEach((card, index) => {
          gsap.fromTo(
            card,
            { scale: 1, filter: 'brightness(1)' },
            {
              scale: 0.94,
              filter: 'brightness(0.78)',
              ease: 'none',
              scrollTrigger: {
                id: `setup:stack-${index}`,
                trigger: card,
                start: 'top top+=90',
                end: 'bottom top+=90',
                scrub: true,
              },
            }
          );
        });
      }

      // 9. Start Window Inset Animation (Refined, no extreme scale)
      const startRoot = document.getElementById('start');
      if (startRoot) {
        startRoot.classList.add('is-transcribing');
        gsap.timeline({
          defaults: { ease: 'power1.out' },
          scrollTrigger: {
            id: 'start:reveal',
            trigger: '#start .start__window',
            start: 'top 80%',
            end: 'top 30%',
            scrub: true,
          },
        })
          .fromTo(
            '#start .start__window',
            { clipPath: 'inset(6% 8% 6% 8% round 36px)' },
            { clipPath: 'inset(0% 0% 0% 0% round 28px)' },
            0
          )
          .fromTo('#start .start__window img', { scale: 1.08 }, { scale: 1 }, 0);
      }

      // 10. Contact Info & Form Coordinated Reveal
      const contactRoot = document.getElementById('contact');
      if (contactRoot) {
        const photo = contactRoot.querySelector('.contact__photo');
        const ways = contactRoot.querySelectorAll('.contact__ways > li');
        const form = contactRoot.querySelector('.contact__form');

        if (photo) {
          gsap.fromTo(
            photo,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: 'power2.out',
              scrollTrigger: {
                id: 'contact:photo',
                trigger: '#contact .contact__inner',
                start: 'top 80%',
                once: true,
              },
            }
          );
        }

        if (form) {
          gsap.fromTo(
            form,
            { opacity: 0, y: 22 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: {
                id: 'contact:form',
                trigger: form,
                start: 'top 80%',
                once: true,
              },
            }
          );
        }
      }
    });

    // Reduced Motion Fallback: Ensure all elements rest in full visibility without transforms
    mm.add('(prefers-reduced-motion: reduce)', () => {
      const allTargets = [
        '#listen .listen__title', '#listen .listen__lead', '#listen .listen__panel--voice', '#listen .listen__panel--read', '#listen .listen__row',
        '#calls .calls__head h2', '#calls .calls__lead', '#calls .calls__item', '#calls .calls__device', '#calls .phone [data-step]',
        '#rooms .rooms__head > *', '#rooms .rooms__place', '#rooms .rooms__line',
        '#voices .voices__title', '#voices .voices__expert', '#voices .voices__col .m-card',
        '#setup .setup__head > *', '#setup .setup__card',
        '#faq .faq__head > *', '#faq .faq__item',
        '#start .start__copy > *', '#start .start__window', '#start .start__window img',
        '#contact .contact__info > *', '#contact .contact__photo', '#contact .contact__ways > li', '#contact .contact__form',
        '.m-band', '.m-band-2', '.m-band-3', '.m-band-4',
      ];
      gsap.set(allTargets, { opacity: 1, y: 0, x: 0, scale: 1, clearProps: 'all' });
    });

    return () => {
      window.removeEventListener('resize', measureNav);
      document.removeEventListener('click', handleHashClick);
      delete (window as any).lenis;
      lenis?.destroy();
      if (tickerCb) {
        gsap.ticker.remove(tickerCb);
      }
      mm.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      document.title = prevTitle;
    };
  }, []);

  const handleStartTrial = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleNavigateLogin = () => {
    navigate('/login');
  };

  const handleNavigateWorkspace = () => {
    navigate('/dashboard');
  };

  return (
    <div className="retentio-landing-root" ref={rootRef}>
      <a className="skip-link m-text-6" href="#main">
        Skip to content
      </a>

      {/* 0. Top Navigation Pill Bar */}
      <LandingNav
        isLoggedIn={isLoggedIn}
        onNavigateLogin={handleNavigateLogin}
        onNavigateWorkspace={handleNavigateWorkspace}
      />

      <main id="main">
        {/* 1. Hero with dual elliptical flow lines & floating chips */}
        <HeroIntersect onStartTrial={handleStartTrial} />

        {/* 2. Voice-to-Text / Churn Signals Split 2-Panel Stage */}
        <ListenPanel />

        {/* 3. Calls Section: 5 Features + Sticky Phone Mockup */}
        <CallsSection onStartTrial={handleStartTrial} />

        {/* 4. In Practice: 5 Photo Cards with Horizontal Wave Track */}
        <RoomsGallery />

        {/* 6. Voices / Social Proof & Testimonials */}
        <TestimonialWall />

        {/* 7. Setup: 3 Numbered Stacking Cards */}
        <StickyDeck />

        {/* 8. FAQ Accordion Section */}
        <FaqSection />

        {/* 9. Start Call To Action with Window Reveal */}
        <StartCta onStartTrial={handleStartTrial} />

        {/* 10. Contact Agency Support & Strategy Form */}
        <ContactSection />
      </main>

      {/* 11. Dark Footer with Giant Typographic Wordmark */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
