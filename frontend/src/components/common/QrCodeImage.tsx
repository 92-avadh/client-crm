import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeImageProps {
  value: string;
  size?: number;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Generates an accurate, high-DPI local PNG QR code data URL so UPI QRs
 * scan reliably on mobile and render cleanly offline/during PDF export.
 */
export const QrCodeImage: React.FC<QrCodeImageProps> = ({
  value,
  size = 92,
  alt = 'UPI QR Code',
  style,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!value) return;
    QRCode.toDataURL(value, {
      width: Math.max(220, size * 3),
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  const resolvedUrl = value ? dataUrl : '';

  if (!resolvedUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#64748b',
          fontSize: 10,
          ...style,
        }}
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      width={size}
      height={size}
      style={{ display: 'block', width: size, height: size, objectFit: 'contain', ...style }}
    />
  );
};
