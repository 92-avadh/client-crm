import React from 'react';
import './premium-loader.css';

export interface PremiumLogoLoaderProps {
  variant?: 'fullscreen' | 'page' | 'inline';
  message?: string;
  showBrandName?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Clean, lightweight, perfectly centered round circular spinner.
 * Replaces heavy logo/video loader with hardware-accelerated 360-degree rotation.
 */
export const PremiumLogoLoader: React.FC<PremiumLogoLoaderProps> = ({
  variant = 'page',
  message,
  size = 'md',
  className = '',
  style = {},
}) => {
  const spinnerSize = size === 'sm' ? 24 : size === 'lg' ? 44 : 34;
  const borderWidth = size === 'sm' ? 2.5 : size === 'lg' ? 3.5 : 3;

  return (
    <div
      className={`retentio-loader-overlay ${variant} ${className}`}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
    >
      <div
        className="retentio-round-spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderWidth,
        }}
      />
      {message && (
        <span className="retentio-loader-subtext">{message}</span>
      )}
    </div>
  );
};

export default PremiumLogoLoader;
