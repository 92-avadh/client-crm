import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface Country {
  code: string;
  name: string;
  dial: string;
  phoneLength: number | number[]; // exact length or array of valid lengths
  flag: string; // ISO 3166-1 alpha-2 code for flagcdn.com
}

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dial: '+91', phoneLength: 10, flag: 'in' },
  { code: 'US', name: 'United States', dial: '+1', phoneLength: 10, flag: 'us' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', phoneLength: 10, flag: 'gb' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', phoneLength: 9, flag: 'ae' },
  { code: 'SG', name: 'Singapore', dial: '+65', phoneLength: 8, flag: 'sg' },
  { code: 'AU', name: 'Australia', dial: '+61', phoneLength: 9, flag: 'au' },
  { code: 'CA', name: 'Canada', dial: '+1', phoneLength: 10, flag: 'ca' },
  { code: 'DE', name: 'Germany', dial: '+49', phoneLength: [10, 11], flag: 'de' },
  { code: 'FR', name: 'France', dial: '+33', phoneLength: 9, flag: 'fr' },
  { code: 'IT', name: 'Italy', dial: '+39', phoneLength: [9, 10], flag: 'it' },
  { code: 'ES', name: 'Spain', dial: '+34', phoneLength: 9, flag: 'es' },
  { code: 'NL', name: 'Netherlands', dial: '+31', phoneLength: 9, flag: 'nl' },
  { code: 'CH', name: 'Switzerland', dial: '+41', phoneLength: 9, flag: 'ch' },
  { code: 'SE', name: 'Sweden', dial: '+46', phoneLength: 9, flag: 'se' },
  { code: 'NO', name: 'Norway', dial: '+47', phoneLength: 8, flag: 'no' },
  { code: 'DK', name: 'Denmark', dial: '+45', phoneLength: 8, flag: 'dk' },
  { code: 'FI', name: 'Finland', dial: '+358', phoneLength: [9, 10], flag: 'fi' },
  { code: 'IE', name: 'Ireland', dial: '+353', phoneLength: 9, flag: 'ie' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', phoneLength: [9, 10], flag: 'nz' },
  { code: 'JP', name: 'Japan', dial: '+81', phoneLength: 10, flag: 'jp' },
  { code: 'KR', name: 'South Korea', dial: '+82', phoneLength: 10, flag: 'kr' },
  { code: 'CN', name: 'China', dial: '+86', phoneLength: 11, flag: 'cn' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', phoneLength: 8, flag: 'hk' },
  { code: 'MY', name: 'Malaysia', dial: '+60', phoneLength: [9, 10], flag: 'my' },
  { code: 'TH', name: 'Thailand', dial: '+66', phoneLength: 9, flag: 'th' },
  { code: 'PH', name: 'Philippines', dial: '+63', phoneLength: 10, flag: 'ph' },
  { code: 'ID', name: 'Indonesia', dial: '+62', phoneLength: [10, 11, 12], flag: 'id' },
  { code: 'VN', name: 'Vietnam', dial: '+84', phoneLength: 9, flag: 'vn' },
  { code: 'PK', name: 'Pakistan', dial: '+92', phoneLength: 10, flag: 'pk' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', phoneLength: 10, flag: 'bd' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', phoneLength: 9, flag: 'lk' },
  { code: 'NP', name: 'Nepal', dial: '+977', phoneLength: 10, flag: 'np' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', phoneLength: 9, flag: 'sa' },
  { code: 'QA', name: 'Qatar', dial: '+974', phoneLength: 8, flag: 'qa' },
  { code: 'KW', name: 'Kuwait', dial: '+965', phoneLength: 8, flag: 'kw' },
  { code: 'BH', name: 'Bahrain', dial: '+973', phoneLength: 8, flag: 'bh' },
  { code: 'OM', name: 'Oman', dial: '+968', phoneLength: 8, flag: 'om' },
  { code: 'ZA', name: 'South Africa', dial: '+27', phoneLength: 9, flag: 'za' },
  { code: 'NG', name: 'Nigeria', dial: '+234', phoneLength: 10, flag: 'ng' },
  { code: 'KE', name: 'Kenya', dial: '+254', phoneLength: 9, flag: 'ke' },
  { code: 'EG', name: 'Egypt', dial: '+20', phoneLength: 10, flag: 'eg' },
  { code: 'BR', name: 'Brazil', dial: '+55', phoneLength: [10, 11], flag: 'br' },
  { code: 'MX', name: 'Mexico', dial: '+52', phoneLength: 10, flag: 'mx' },
  { code: 'AR', name: 'Argentina', dial: '+54', phoneLength: 10, flag: 'ar' },
  { code: 'CL', name: 'Chile', dial: '+56', phoneLength: 9, flag: 'cl' },
  { code: 'CO', name: 'Colombia', dial: '+57', phoneLength: 10, flag: 'co' },
  { code: 'RU', name: 'Russia', dial: '+7', phoneLength: 10, flag: 'ru' },
  { code: 'TR', name: 'Turkey', dial: '+90', phoneLength: 10, flag: 'tr' },
  { code: 'IL', name: 'Israel', dial: '+972', phoneLength: 9, flag: 'il' },
  { code: 'PL', name: 'Poland', dial: '+48', phoneLength: 9, flag: 'pl' },
  { code: 'PT', name: 'Portugal', dial: '+351', phoneLength: 9, flag: 'pt' },
  { code: 'AT', name: 'Austria', dial: '+43', phoneLength: [10, 11], flag: 'at' },
  { code: 'BE', name: 'Belgium', dial: '+32', phoneLength: 9, flag: 'be' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420', phoneLength: 9, flag: 'cz' },
  { code: 'HU', name: 'Hungary', dial: '+36', phoneLength: 9, flag: 'hu' },
  { code: 'RO', name: 'Romania', dial: '+40', phoneLength: 9, flag: 'ro' },
  { code: 'GR', name: 'Greece', dial: '+30', phoneLength: 10, flag: 'gr' },
];

/**
 * Extracts a normalized country code and national phone digits
 * from raw phone strings that may contain +country prefixes.
 */
export function parsePhoneAndCountry(rawPhone?: string | null, defaultCountry = 'IN'): { countryCode: string; nationalNumber: string } {
  if (!rawPhone) return { countryCode: defaultCountry, nationalNumber: '' };
  const trimmed = String(rawPhone).trim();
  if (trimmed.startsWith('+')) {
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.dial)) {
        return { countryCode: c.code, nationalNumber: trimmed.slice(c.dial.length).trim() };
      }
    }
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (defaultCountry === 'IN' && digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
    return { countryCode: 'IN', nationalNumber: digitsOnly.slice(2) };
  }
  return { countryCode: defaultCountry, nationalNumber: trimmed };
}

interface CountryCodePickerProps {
  countryCode: string; // ISO code e.g. 'IN'
  onCountryChange: (country: Country) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  countryCode,
  onCountryChange,
  phoneNumber,
  onPhoneChange,
  onBlur,
  placeholder,
  error,
  required,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Filter countries by search
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Validate phone length
  const getPhoneValidationError = (): string => {
    if (!phoneNumber) {
      return (required && isTouched) ? 'Phone number is required' : '';
    }
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) {
      return (required && isTouched) ? 'Phone number is required' : '';
    }
    const lengths = Array.isArray(selectedCountry.phoneLength)
      ? selectedCountry.phoneLength
      : [selectedCountry.phoneLength];
    if (isTouched && !lengths.includes(digits.length)) {
      const expected = lengths.join(' or ');
      return `${selectedCountry.name} numbers must be ${expected} digits`;
    }
    return '';
  };

  const phoneError = error || getPhoneValidationError();

  const handlePhoneChange = (value: string) => {
    // Allow only digits, spaces, dashes, parentheses
    const cleaned = value.replace(/[^\d\s\-()]/g, '');
    onPhoneChange(cleaned);
  };

  const getMaxLength = () => {
    const lengths = Array.isArray(selectedCountry.phoneLength)
      ? selectedCountry.phoneLength
      : [selectedCountry.phoneLength];
    return Math.max(...lengths);
  };

  return (
    <div style={{ position: 'relative', ...style }} ref={dropdownRef}>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        background: phoneError ? 'var(--danger-bg, #FEF2F2)' : 'var(--bg-card)',
        border: `1px solid ${phoneError ? 'var(--danger-border, #EF4444)' : 'var(--border-strong)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: phoneError ? '0 0 0 3px rgba(239, 68, 68, 0.08)' : 'none',
      }}
      onFocus={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          e.currentTarget.style.borderColor = phoneError ? 'var(--danger-border, #EF4444)' : 'var(--brand-green, #059639)';
          e.currentTarget.style.boxShadow = phoneError ? '0 0 0 3px rgba(239, 68, 68, 0.08)' : '0 0 0 3px rgba(5, 150, 57, 0.12)';
        }
      }}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsTouched(true);
          if (onBlur) onBlur();
          e.currentTarget.style.borderColor = phoneError ? 'var(--danger-border, #EF4444)' : 'var(--border-strong)';
          e.currentTarget.style.boxShadow = phoneError ? '0 0 0 3px rgba(239, 68, 68, 0.08)' : 'none';
        }
      }}
      >
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 12px',
            background: 'var(--bg-subtle)',
            border: 'none',
            borderRight: '1px solid var(--border)',
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            transition: 'background 0.15s',
            minWidth: 80,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
        >
          <img
            src={`https://flagcdn.com/w20/${selectedCountry.flag}.png`}
            srcSet={`https://flagcdn.com/w40/${selectedCountry.flag}.png 2x`}
            alt={selectedCountry.name}
            width={20}
            height={15}
            style={{
              borderRadius: 2,
              objectFit: 'cover',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
            loading="lazy"
          />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            {selectedCountry.dial}
          </span>
          <ChevronDown size={12} style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }} />
        </button>

        {/* Phone input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => handlePhoneChange(e.target.value)}
          onBlur={() => {
            setIsTouched(true);
            if (onBlur) onBlur();
          }}
          placeholder={placeholder || `Phone (${getMaxLength()} digits)`}
          maxLength={getMaxLength() + 3} // Allow for spaces/dashes
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            fontSize: 16, // 16px to prevent iOS zoom
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            minWidth: 0,
          }}
        />
      </div>

      {/* Error message */}
      {phoneError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 6,
          fontSize: 12,
          color: 'var(--danger-text)',
          fontWeight: 600,
          animation: 'fadeSlideUp 0.2s ease',
        }}>
          <span style={{ fontSize: 12 }}>⚠</span>
          <span>{phoneError}</span>
        </div>
      )}

      {/* Hint when no error */}
      {!phoneError && phoneNumber && (
        <div style={{
          marginTop: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {selectedCountry.name} · {getMaxLength()} digits expected
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: 320,
          overflow: 'hidden',
          animation: 'fadeSlideUp 0.2s ease',
        }}>
          {/* Search */}
          <div style={{
            padding: 10,
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              background: 'var(--bg-subtle)',
              borderRadius: 8,
            }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country or code..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Country list */}
          <div style={{
            maxHeight: 240,
            overflowY: 'auto',
          }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: 20,
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}>
                No countries found
              </div>
            ) : (
              filtered.map(country => {
                const isSelected = country.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onCountryChange(country);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 14px',
                      background: isSelected ? 'var(--brand-green-subtle, #ECFDF5)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <img
                      src={`https://flagcdn.com/w20/${country.flag}.png`}
                      srcSet={`https://flagcdn.com/w40/${country.flag}.png 2x`}
                      alt={country.name}
                      width={20}
                      height={15}
                      style={{
                        borderRadius: 2,
                        objectFit: 'cover',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        flexShrink: 0,
                      }}
                      loading="lazy"
                    />
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 550,
                      color: 'var(--text-primary)',
                    }}>
                      {country.name}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {country.dial}
                    </span>
                    {isSelected && (
                      <Check size={14} style={{ color: 'var(--brand-green, #059639)', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CountryCodePicker;
