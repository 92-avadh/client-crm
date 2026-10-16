import React, { useState, useEffect, useRef } from 'react';

/**
 * Hook to smoothly animate numbers counting up from 0 to target.
 * Uses requestAnimationFrame with cubic ease-out for a smooth SaaS feel.
 *
 * @param target The target number to count to
 * @param duration Animation duration in milliseconds (default: 1000ms)
 * @returns Animated current number value
 */
export const useCountUp = (target: number, duration = 1000): number => {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    // If target is 0 and we are already at 0, nothing to animate
    if (safeTarget === 0 && currentRef.current === 0) {
      setValue(0);
      return;
    }

    const startValue = currentRef.current;
    const endValue = safeTarget;
    if (startValue === endValue && currentRef.current !== 0) return;

    let startTime: number | null = null;
    let frameId: number;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startValue + (endValue - startValue) * eased);
      currentRef.current = next;
      setValue(next);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        currentRef.current = endValue;
        setValue(endValue);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [safeTarget, duration]);

  return value;
};

/**
 * Component that formats and animates any numeric value as a count-up.
 */
export const AnimatedNumber: React.FC<{
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ value, duration = 1000, prefix = '', suffix = '', className = '', style }) => {
  const animated = useCountUp(value, duration);
  const isNegative = animated < 0;
  const cleanPrefix = prefix === '?' ? '₹' : prefix;
  const absFormatted = Math.abs(animated).toLocaleString('en-IN');

  return (
    <span className={className} style={style}>
      {isNegative ? `-${cleanPrefix}${absFormatted}${suffix}` : `${cleanPrefix}${absFormatted}${suffix}`}
    </span>
  );
};
