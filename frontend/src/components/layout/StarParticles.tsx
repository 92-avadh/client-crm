import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const StarParticles: React.FC = () => {
  const { theme } = useApp();

  // Deterministic set of stars across the viewport (stable across re-renders)
  const stars = useMemo(() => {
    return [
      { id: 1, top: '8%', left: '14%', size: 1.5, opacity: 0.35, animDuration: '3.2s', delay: '0.2s' },
      { id: 2, top: '12%', left: '42%', size: 2, opacity: 0.45, animDuration: '4.1s', delay: '1.4s' },
      { id: 3, top: '18%', left: '76%', size: 1, opacity: 0.25, animDuration: '3.8s', delay: '0.7s' },
      { id: 4, top: '24%', left: '88%', size: 2.5, opacity: 0.5, animDuration: '5.2s', delay: '2.1s' },
      { id: 5, top: '29%', left: '22%', size: 1.5, opacity: 0.3, animDuration: '4.5s', delay: '1.0s' },
      { id: 6, top: '35%', left: '60%', size: 1, opacity: 0.2, animDuration: '3.0s', delay: '0.5s' },
      { id: 7, top: '42%', left: '33%', size: 2, opacity: 0.4, animDuration: '4.8s', delay: '1.8s' },
      { id: 8, top: '48%', left: '92%', size: 1.5, opacity: 0.35, animDuration: '3.6s', delay: '2.5s' },
      { id: 9, top: '55%', left: '16%', size: 2, opacity: 0.3, animDuration: '5.0s', delay: '0.9s' },
      { id: 10, top: '62%', left: '71%', size: 1.5, opacity: 0.4, animDuration: '4.2s', delay: '1.2s' },
      { id: 11, top: '68%', left: '47%', size: 2.5, opacity: 0.45, animDuration: '5.6s', delay: '2.8s' },
      { id: 12, top: '75%', left: '82%', size: 1, opacity: 0.25, animDuration: '3.4s', delay: '0.4s' },
      { id: 13, top: '82%', left: '27%', size: 2, opacity: 0.35, animDuration: '4.4s', delay: '1.7s' },
      { id: 14, top: '89%', left: '64%', size: 1.5, opacity: 0.3, animDuration: '3.9s', delay: '0.8s' },
      { id: 15, top: '94%', left: '90%', size: 1, opacity: 0.2, animDuration: '4.7s', delay: '2.2s' },
      { id: 16, top: '6%', left: '68%', size: 2, opacity: 0.4, animDuration: '4.0s', delay: '1.5s' },
      { id: 17, top: '15%', left: '29%', size: 1, opacity: 0.25, animDuration: '3.5s', delay: '0.3s' },
      { id: 18, top: '22%', left: '52%', size: 2.5, opacity: 0.5, animDuration: '5.4s', delay: '2.6s' },
      { id: 19, top: '38%', left: '84%', size: 1.5, opacity: 0.3, animDuration: '4.3s', delay: '1.1s' },
      { id: 20, top: '45%', left: '11%', size: 2, opacity: 0.35, animDuration: '3.7s', delay: '0.6s' },
      { id: 21, top: '53%', left: '40%', size: 1, opacity: 0.2, animDuration: '4.9s', delay: '2.0s' },
      { id: 22, top: '60%', left: '96%', size: 2, opacity: 0.4, animDuration: '3.8s', delay: '1.3s' },
      { id: 23, top: '72%', left: '19%', size: 1.5, opacity: 0.3, animDuration: '5.1s', delay: '2.4s' },
      { id: 24, top: '79%', left: '55%', size: 2, opacity: 0.45, animDuration: '4.6s', delay: '0.9s' },
      { id: 25, top: '86%', left: '78%', size: 1, opacity: 0.25, animDuration: '3.3s', delay: '1.6s' },
      { id: 26, top: '91%', left: '38%', size: 2, opacity: 0.35, animDuration: '4.8s', delay: '0.2s' },
      { id: 27, top: '4%', left: '88%', size: 1.5, opacity: 0.3, animDuration: '3.6s', delay: '1.9s' },
      { id: 28, top: '17%', left: '6%', size: 2, opacity: 0.4, animDuration: '5.3s', delay: '2.7s' },
      { id: 29, top: '31%', left: '45%', size: 1, opacity: 0.25, animDuration: '4.1s', delay: '0.8s' },
      { id: 30, top: '50%', left: '75%', size: 2, opacity: 0.35, animDuration: '3.9s', delay: '1.4s' },
      { id: 31, top: '65%', left: '8%', size: 1.5, opacity: 0.3, animDuration: '4.7s', delay: '0.5s' },
      { id: 32, top: '80%', left: '93%', size: 2, opacity: 0.4, animDuration: '5.0s', delay: '2.3s' },
    ];
  }, []);

  return (
    <div
      className="dark-star-particles"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity: theme === 'dark' ? 1 : 0,
        visibility: theme === 'dark' ? 'visible' : 'hidden',
        transition: 'opacity 0.8s ease, visibility 0.8s ease',
      }}
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="star-point"
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            backgroundColor: 'var(--solid-btn-text)',
            boxShadow: s.size > 2 ? '0 0 6px 1px rgba(56, 189, 248, 0.4)' : '0 0 3px rgba(255, 255, 255, 0.6)',
            opacity: s.opacity,
            animation: `starTwinkle ${s.animDuration} infinite ease-in-out ${s.delay}`,
          }}
        />
      ))}
    </div>
  );
};
