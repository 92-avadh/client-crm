import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface ScrollRevealProps {
  children?: React.ReactNode;
  highlightColor?: string;
  mode?: 'scrub' | 'enter';
  splitBy?: 'words' | 'chars' | 'lines' | 'none';
  effect?: 'fade' | 'rise' | 'slide' | 'scale';
  stagger?: number;
  duration?: number;
  smoothing?: number;
  baseOpacity?: number;
  baseRotation?: number;
  baseOffset?: number;
  enableBlur?: boolean;
  blurStrength?: number;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  scrollStart?: string;
  scrollEnd?: string;
}

/**
 * Cinematic ScrollReveal component (React Bits pattern).
 * Animates text or cards smoothly on scroll with word/char unblurring,
 * progressive opacity, rotation tilt, and scrub support.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  highlightColor = '',
  mode = 'scrub',
  splitBy = 'words',
  effect = 'fade',
  stagger = 0.05,
  duration = 0.8,
  smoothing = 0,
  baseOpacity = 0.1,
  baseRotation = 3,
  baseOffset = 0,
  enableBlur = true,
  blurStrength = 4,
  as: Component = 'div',
  className = '',
  style = {},
  scrollStart = 'top 85%',
  scrollEnd = 'bottom 50%',
}) => {
  const containerRef = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // A11y: Respect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      let targets: Element[] = Array.from(el.querySelectorAll('.scroll-reveal-item'));
      if (targets.length === 0) {
        targets = [el];
      }

      // Initial visual states
      const fromVars: gsap.TweenVars = {
        opacity: baseOpacity,
        immediateRender: true,
      };

      if (enableBlur) {
        fromVars.filter = `blur(${blurStrength}px)`;
      }

      if (baseOffset !== 0) {
        fromVars.y = baseOffset;
      } else if (effect === 'rise' || effect === 'slide') {
        fromVars.y = 24;
      }

      if (baseRotation !== 0) {
        fromVars.rotation = baseRotation;
      }

      if (effect === 'scale') {
        fromVars.scale = 0.94;
      }

      if (highlightColor) {
        fromVars.color = highlightColor;
      }

      // Target reveal states
      const toVars: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        rotation: 0,
        scale: 1,
        stagger: stagger,
        ease: mode === 'scrub' ? 'none' : 'power2.out',
      };

      if (enableBlur) {
        toVars.filter = 'blur(0px)';
      }

      if (highlightColor) {
        toVars.color = 'inherit';
      }

      if (mode === 'scrub') {
        toVars.scrollTrigger = {
          trigger: el,
          start: scrollStart,
          end: scrollEnd,
          scrub: smoothing > 0 ? smoothing : true,
          invalidateOnRefresh: true,
        };
      } else {
        toVars.duration = duration;
        toVars.scrollTrigger = {
          trigger: el,
          start: scrollStart,
          toggleActions: 'play none none reverse',
        };
      }

      gsap.fromTo(targets, fromVars, toVars);
    }, el);

    return () => ctx.revert();
  }, [
    mode,
    splitBy,
    effect,
    stagger,
    duration,
    smoothing,
    baseOpacity,
    baseRotation,
    baseOffset,
    enableBlur,
    blurStrength,
    highlightColor,
    scrollStart,
    scrollEnd,
  ]);

  // Case 1: children is a direct string
  if (typeof children === 'string') {
    if (splitBy === 'words') {
      const words = children.split(/\s+/).filter(Boolean);
      return (
        <Component
          ref={containerRef}
          className={`scroll-reveal-container ${className}`}
          style={style}
        >
          {words.map((word, i) => (
            <React.Fragment key={i}>
              <span
                className="scroll-reveal-item scroll-reveal-word"
                style={{
                  display: 'inline-block',
                  willChange: 'opacity, filter, transform',
                  transformOrigin: '0% 50%',
                }}
              >
                {word}
              </span>
              {i < words.length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </Component>
      );
    }

    if (splitBy === 'chars') {
      const chars = Array.from(children);
      return (
        <Component
          ref={containerRef}
          className={`scroll-reveal-container ${className}`}
          style={style}
        >
          {chars.map((char, i) => (
            <span
              key={i}
              className="scroll-reveal-item scroll-reveal-char"
              style={{
                display: 'inline-block',
                whiteSpace: char === ' ' ? 'pre' : 'normal',
                willChange: 'opacity, filter, transform',
              }}
            >
              {char}
            </span>
          ))}
        </Component>
      );
    }

    if (splitBy === 'lines') {
      const lines = children.split('\n').filter(Boolean);
      return (
        <Component
          ref={containerRef}
          className={`scroll-reveal-container ${className}`}
          style={style}
        >
          {lines.map((line, i) => (
            <span
              key={i}
              className="scroll-reveal-item scroll-reveal-line"
              style={{
                display: 'block',
                willChange: 'opacity, filter, transform',
              }}
            >
              {line}
            </span>
          ))}
        </Component>
      );
    }
  }

  // Case 2: children is a single React element that wraps text
  if (React.isValidElement(children) && typeof (children.props as any)?.children === 'string' && splitBy !== 'none') {
    const rawText = (children.props as any).children as string;
    const ChildType = children.type as React.ElementType;
    const childProps = children.props as Record<string, any>;

    if (splitBy === 'words') {
      const words = rawText.split(/\s+/).filter(Boolean);
      return (
        <ChildType
          {...childProps}
          ref={containerRef}
          className={`scroll-reveal-container ${childProps.className || ''} ${className}`}
          style={{ ...childProps.style, ...style }}
        >
          {words.map((word, i) => (
            <React.Fragment key={i}>
              <span
                className="scroll-reveal-item scroll-reveal-word"
                style={{
                  display: 'inline-block',
                  willChange: 'opacity, filter, transform',
                  transformOrigin: '0% 50%',
                }}
              >
                {word}
              </span>
              {i < words.length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </ChildType>
      );
    }
  }

  // Case 3: children is elements or cards (or splitBy='none')
  return (
    <Component
      ref={containerRef}
      className={`scroll-reveal-container ${className}`}
      style={style}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const childProps = (child.props as Record<string, any>) || {};
        const existingClass = childProps.className || '';
        return React.cloneElement(child as React.ReactElement<any>, {
          className: `${existingClass} scroll-reveal-item`.trim(),
          style: {
            ...childProps.style,
            willChange: 'opacity, filter, transform',
          },
        });
      })}
    </Component>
  );
};

export default ScrollReveal;
