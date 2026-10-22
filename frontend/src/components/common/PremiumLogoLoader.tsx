import React from 'react';
import './premium-loader.css';

interface PremiumLogoLoaderProps {
  variant?: 'fullscreen' | 'page' | 'inline';
  message?: string;
  showBrandName?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Premium cinematic motion-style logo loader.
 * Uses the Retentio continuous-arrow green ribbon logo with concentric orbital comet tracks,
 * bioluminescent aura, sonar pulse rings, and a luminous progress glider.
 */
export const PremiumLogoLoader: React.FC<PremiumLogoLoaderProps> = ({
  variant = 'page',
  message = 'Loading workspace...',
  showBrandName = true,
  showProgress = true,
  size = 'md',
  className = '',
  style = {},
}) => {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;

  return (
    <div
      className={`retentio-loader-overlay ${variant} ${className}`}
      style={style}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Ambient Radial Backlight Glow */}
      <div className="retentio-loader-aura" style={{ transform: `scale(${scale}) translateZ(0)` }} />

      {/* Main Animated Stage */}
      <div
        className="retentio-loader-stage"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Concentric Sonar Pulse Wave Rings */}
        <div className="retentio-sonar-ring ring-1" />
        <div className="retentio-sonar-ring ring-2" />

        {/* Counter-Rotating Precision Dashed Track */}
        <div className="retentio-orbit-track retentio-orbit-inner" />

        {/* Outer Orbital Neon Comet Track */}
        <div className="retentio-orbit-track retentio-orbit-outer" />

        {/* Floating Logo Capsule with Specular Light Sweep */}
        <div className="retentio-logo-capsule">
          <img
            src="/retentio-icon.png"
            alt="Retentio Logo"
            className="retentio-logo-img"
            loading="eager"
            decoding="async"
          />
          {/* Specular Studio Light Shimmer */}
          <div className="retentio-sheen-shimmer" />
        </div>
      </div>

      {/* Brand Title, Status Caption & Glowing Progress Bar */}
      {(showBrandName || message || showProgress) && (
        <div className="retentio-loader-text-wrap">
          {showBrandName && (
            <div className="retentio-loader-brand-title">
              RETENTIO
            </div>
          )}
          {message && (
            <div className="retentio-loader-subtext">
              {message}
            </div>
          )}
          {showProgress && (
            <div className="retentio-loader-progress-track">
              <div className="retentio-loader-progress-fill" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PremiumLogoLoader;
