import React, { useState, useEffect, useRef } from 'react';

/**
 * Hook to smoothly animate numbers counting up from 0 (or previous value) to target.
 * Uses requestAnimationFrame with cubic ease-out for a satisfying, premium SaaS feel.
 *
 * @param target The target number to count to
 * @param duration Animation duration in milliseconds (default: 1100ms)
 * @returns Animated current number value
 */
export const useCountUp = (target: number, duration = 1100): number => {
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const from = isFirstRender.current ? 0 : prevTargetRef.current;
    isFirstRender.current = false;
    prevTargetRef.current = target;

    if (from === target) {
      setValue(target);
      return;
    }

    let frameId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      setValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

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
}> = ({ value, duration = 1100, prefix = '', suffix = '', className = '', style }) => {
  const animated = useCountUp(value, duration);
  const isNegative = animated < 0;
  const absFormatted = Math.abs(animated).toLocaleString('en-IN');

  return (
    <span className={className} style={style}>
      {isNegative ? `-${prefix}${absFormatted}${suffix}` : `${prefix}${absFormatted}${suffix}`}
    </span>
  );
};
