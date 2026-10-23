/**
 * Currency utility helpers for formatting and input handling with currency signs
 */

export interface CurrencyOption {
  code: string;
  sign: string;
  label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'NGN', sign: '₦', label: '₦ (NGN) Nigerian Naira' },
  { code: 'USD', sign: '$', label: '$ (USD) US Dollar' },
  { code: 'EUR', sign: '€', label: '€ (EUR) Euro' },
  { code: 'GBP', sign: '£', label: '£ (GBP) British Pound' },
  { code: 'CAD', sign: 'CAD$', label: 'CAD$ Canadian Dollar' },
  { code: 'GHS', sign: 'GH₵', label: 'GH₵ Ghanaian Cedi' },
  { code: 'KES', sign: 'KSh', label: 'KSh Kenyan Shilling' },
  { code: 'ZAR', sign: 'R', label: 'R (ZAR) South African Rand' },
];

/**
 * Ensures a transaction value string always displays a clean, readable currency sign.
 * If user entered "500000", formats to "₦ 500,000".
 * If already contains "$3,800", preserves the "$" currency sign.
 */
export function formatTransactionCurrency(value?: string | number | null, fallbackSign = '₦'): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  // Recognized currency symbols or 3-letter codes
  const hasSign = /[\$€£¥₦₹₩₱₫₸₼₺₽R]|\b(USD|EUR|GBP|NGN|CAD|AUD|KES|GHS|ZAR)\b/i.test(str);
  if (hasSign) {
    return str;
  }

  // If numeric, format with commas and prepend fallback currency sign
  const numericOnly = str.replace(/[^\d.-]/g, '');
  if (numericOnly && !isNaN(Number(numericOnly))) {
    const num = Number(numericOnly);
    return `${fallbackSign} ${num.toLocaleString('en-US')}`;
  }

  return `${fallbackSign} ${str}`;
}
