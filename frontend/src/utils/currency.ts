export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  formatExample: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN', formatExample: '₹50,000' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US', formatExample: '$50,000' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE', formatExample: '€50,000' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB', formatExample: '£50,000' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE', formatExample: 'AED 50,000' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA', formatExample: 'CA$50,000' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU', formatExample: 'AU$50,000' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG', formatExample: 'SG$50,000' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA', formatExample: 'SAR 50,000' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP', formatExample: '¥50,000' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', locale: 'de-CH', formatExample: 'CHF 50,000' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', locale: 'en-NZ', formatExample: 'NZ$50,000' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', locale: 'en-ZA', formatExample: 'R 50,000' },
];

export function getCurrencyConfig(codeOrSymbol?: string): CurrencyOption {
  if (!codeOrSymbol) return SUPPORTED_CURRENCIES[0];
  const query = codeOrSymbol.toUpperCase().trim();
  const found = SUPPORTED_CURRENCIES.find(
    (c) => c.code === query || c.symbol === codeOrSymbol || c.symbol.trim() === codeOrSymbol.trim()
  );
  return found || {
    code: query,
    symbol: codeOrSymbol,
    name: query,
    flag: '🌐',
    locale: 'en-US',
    formatExample: `${codeOrSymbol}50,000`,
  };
}

/**
 * Format any numerical value using the active currency symbol and localization rules.
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCodeOrSymbol?: string,
  options?: { hideDecimals?: boolean; space?: boolean }
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return `${currencyCodeOrSymbol || '₹'}0`;

  const conf = getCurrencyConfig(currencyCodeOrSymbol);
  const locale = conf.locale || 'en-US';

  const formattedNum = num.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: options?.hideDecimals ? 0 : 2,
  });

  const sep = options?.space || conf.symbol.length > 1 ? ' ' : '';
  return `${conf.symbol}${sep}${formattedNum}`;
}
