import React, { useEffect, useState } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}

/**
 * Single viewport-aware tooltip renderer for any element with `[data-tip]`.
 * Uses `closest('[data-tip]')` so nested elements never show overlapping tooltips,
 * and flips below/inside screen edges when near the top or sides of the viewport.
 */
export const GlobalTooltipLayer: React.FC = () => {
  const [tip, setTip] = useState<TooltipState | null>(null);

  useEffect(() => {
    let activeEl: HTMLElement | null = null;

    const computeTip = (el: HTMLElement) => {
      const text = el.getAttribute('data-tip')?.trim();
      if (!text) {
        setTip(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setTip(null);
        return;
      }
      const showBelow = rect.top < 64;
      const centerX = rect.left + rect.width / 2;
      const clampedX = Math.max(136, Math.min(window.innerWidth - 136, centerX));
      const y = showBelow ? rect.bottom + 8 : rect.top - 8;

      setTip({
        text,
        x: clampedX,
        y,
        placement: showBelow ? 'bottom' : 'top',
      });
    };

    const handlePointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const match = target?.closest?.('[data-tip]') as HTMLElement | null;
      if (!match) {
        if (activeEl) {
          activeEl = null;
          setTip(null);
        }
        return;
      }
      if (match !== activeEl) {
        activeEl = match;
        computeTip(match);
      }
    };

    const handlePointerOut = (e: MouseEvent) => {
      if (!activeEl) return;
      const related = e.relatedTarget as HTMLElement | null;
      const nextMatch = related?.closest?.('[data-tip]') as HTMLElement | null;
      if (nextMatch !== activeEl) {
        activeEl = nextMatch;
        if (nextMatch) {
          computeTip(nextMatch);
        } else {
          setTip(null);
        }
      }
    };

    const handleDismiss = () => {
      activeEl = null;
      setTip(null);
    };

    document.addEventListener('mouseover', handlePointerOver, true);
    document.addEventListener('mouseout', handlePointerOut, true);
    document.addEventListener('focusin', handlePointerOver, true);
    document.addEventListener('focusout', handleDismiss, true);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);

    return () => {
      document.removeEventListener('mouseover', handlePointerOver, true);
      document.removeEventListener('mouseout', handlePointerOut, true);
      document.removeEventListener('focusin', handlePointerOver, true);
      document.removeEventListener('focusout', handleDismiss, true);
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
    };
  }, []);

  if (!tip) return null;

  return (
    <div
      role="tooltip"
      className="no-print"
      style={{
        position: 'fixed',
        left: tip.x,
        top: tip.y,
        transform:
          tip.placement === 'bottom'
            ? 'translate(-50%, 0)'
            : 'translate(-50%, -100%)',
        zIndex: 99999,
        pointerEvents: 'none',
        background: '#0f172a',
        color: '#f8fafc',
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1.4,
        padding: '6px 11px',
        borderRadius: 8,
        maxWidth: 250,
        textAlign: 'center',
        whiteSpace: 'normal',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.24)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {tip.text}
    </div>
  );
};
