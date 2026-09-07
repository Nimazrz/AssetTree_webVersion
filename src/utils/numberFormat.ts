/**
 * Number & Currency Formatting Utilities
 * Handles Persian/English numerals, compact financial notations (Hemmat, Billion, Million),
 * decimal precision, and privacy masking.
 */

import { CurrencyUnit, DisplaySettings, AppLanguage } from '../types';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  const str = input.toString();
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function formatNumberWithCommas(
  value: number | null | undefined,
  usePersianDigits = true,
  maxFractionDigits = 2,
  language: AppLanguage = 'fa'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return (language === 'fa' && usePersianDigits) ? '۰' : '0';
  }

  const parts = value.toFixed(maxFractionDigits).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Trim trailing zeros from decimals
  if (parts[1]) {
    parts[1] = parts[1].replace(/0+$/, '');
    if (parts[1] === '') {
      parts.pop();
    }
  }

  const formatted = parts.join('.');
  if (language === 'fa' && usePersianDigits) {
    return toPersianDigits(formatted).replace(/,/g, '،');
  }
  return formatted;
}

export function formatCurrency(
  amountInRials: number,
  unit: CurrencyUnit = 'TOMAN',
  compact = false,
  usePersianDigits = true,
  privacyMode = false,
  language: AppLanguage = 'fa'
): string {
  const isEn = language === 'en';
  const unitSuffix = isEn
    ? (unit === 'TOMAN' ? 'Toman' : 'Rial')
    : (unit === 'TOMAN' ? 'تومان' : 'ریال');

  if (privacyMode) {
    return `•••••• ${unitSuffix}`;
  }

  const zeroStr = (isEn || !usePersianDigits) ? '0' : '۰';
  if (isNaN(amountInRials) || amountInRials === 0) {
    return `${zeroStr} ${unitSuffix}`;
  }

  const isToman = unit === 'TOMAN';
  const displayAmount = isToman ? amountInRials / 10 : amountInRials;

  const shouldPersianize = !isEn && usePersianDigits;

  if (!compact) {
    const rounded = Math.round(displayAmount);
    const formattedNum = formatNumberWithCommas(rounded, shouldPersianize, 0, language);
    return `${formattedNum} ${unitSuffix}`;
  }

  // Compact notation
  const absAmount = Math.abs(displayAmount);

  if (absAmount >= 1_000_000_000_000) {
    const valInHemmat = displayAmount / 1_000_000_000_000;
    const formatted = valInHemmat.toFixed(2).replace(/\.?0+$/, '');
    const finalNum = shouldPersianize ? toPersianDigits(formatted) : formatted;
    const label = isEn ? 'T' : (isToman ? 'همت' : 'هزار م.م.ر');
    return `${finalNum} ${label}`;
  } else if (absAmount >= 1_000_000_000) {
    const valInBillion = displayAmount / 1_000_000_000;
    const formatted = valInBillion.toFixed(1).replace(/\.?0+$/, '');
    const finalNum = shouldPersianize ? toPersianDigits(formatted) : formatted;
    const label = isEn ? 'B' : (isToman ? 'م.م.ت' : 'م.م.ر');
    return `${finalNum} ${label}`;
  } else if (absAmount >= 1_000_000) {
    const valInMillion = displayAmount / 1_000_000;
    const formatted = valInMillion.toFixed(1).replace(/\.?0+$/, '');
    const finalNum = shouldPersianize ? toPersianDigits(formatted) : formatted;
    const label = isEn ? 'M' : (isToman ? 'م.ت' : 'م.ر');
    return `${finalNum} ${label}`;
  } else if (absAmount >= 1_000) {
    const valInThousand = displayAmount / 1_000;
    const formatted = valInThousand.toFixed(0);
    const finalNum = shouldPersianize ? toPersianDigits(formatted) : formatted;
    const label = isEn ? 'K' : (isToman ? 'ه.ت' : 'ه.ر');
    return `${finalNum} ${label}`;
  } else {
    const formatted = formatNumberWithCommas(displayAmount, shouldPersianize, 0, language);
    return `${formatted} ${unitSuffix}`;
  }
}

export function formatCompactAbbreviation(
  amountInRials: number,
  unit: CurrencyUnit = 'TOMAN',
  usePersianDigits = true,
  privacyMode = false,
  language: AppLanguage = 'fa'
): string {
  if (privacyMode) return '••••••';
  return formatCurrency(amountInRials, unit, true, usePersianDigits, false, language);
}

export function formatPercentage(
  percent: number,
  decimalPlaces = 1,
  usePersianDigits = true,
  language: AppLanguage = 'fa'
): string {
  const isEn = language === 'en';
  const shouldPersianize = !isEn && usePersianDigits;

  if (isNaN(percent) || percent === 0) {
    const zero = decimalPlaces === 0 ? '0' : (0).toFixed(decimalPlaces);
    const res = shouldPersianize ? toPersianDigits(zero) : zero;
    return isEn ? `${res}%` : `${res}٪`;
  }

  const formatted = percent.toFixed(decimalPlaces);
  if (isEn) {
    return `${formatted}%`;
  }
  const res = shouldPersianize ? toPersianDigits(formatted).replace('.', '/') : formatted;
  return `${res}٪`;
}

export function formatNodeMetricsSlashSeparated(
  totalValue: number,
  percentOfTotal: number,
  percentOfGroup: number,
  isRoot: boolean,
  settings: DisplaySettings
): string {
  const isEn = settings.language === 'en';
  const parts: string[] = [];

  if (settings.showPercentOfTotal && !isRoot) {
    const pct = formatPercentage(percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, settings.language);
    parts.push(isEn ? `${pct} of total` : `${pct} از کل`);
  } else if (settings.showPercentOfTotal && isRoot) {
    parts.push(isEn ? '100% total' : '۱۰۰٪ کل');
  }

  if (settings.showPercentOfGroup && !isRoot) {
    const pct = formatPercentage(percentOfGroup, settings.decimalPlaces, settings.usePersianDigits, settings.language);
    parts.push(isEn ? `${pct} of group` : `${pct} از گروه`);
  }

  if (settings.showTotalValue) {
    parts.push(formatCompactAbbreviation(totalValue, settings.currencyUnit, settings.usePersianDigits, settings.privacyMode, settings.language));
  }

  return parts.join(' / ');
}
