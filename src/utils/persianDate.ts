/**
 * Persian (Jalali) Calendar Utilities
 * Ported and enhanced from Kotlin codebase for high-accuracy date conversions,
 * formatting, and localized backup timestamps.
 */

import { toPersianDigits } from './numberFormat';

export const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

export const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه',
];

export interface PersianDateComponents {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayOfWeekName: string;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Converts Gregorian calendar (year, month, day) to Jalali (Persian) calendar (jy, jm, jd)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  const gy2 = gy - 1600;
  const gm2 = gm - 1;
  const gd2 = gd - 1;

  let gDayNo = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm2; i++) {
    gDayNo += gDaysInMonth[i];
  }
  if (gm2 > 1 && ((gy2 % 4 === 0 && gy2 % 100 !== 0) || gy2 % 400 === 0)) {
    gDayNo++;
  }
  gDayNo += gd2;

  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm = 0;
  for (let i = 0; i < 11; i++) {
    if (jDayNo < jDaysInMonth[i]) {
      jm = i + 1;
      break;
    }
    jDayNo -= jDaysInMonth[i];
  }
  if (jm === 0) {
    jm = 12;
  }
  const jd = jDayNo + 1;

  return [jy, jm, jd];
}

/**
 * Extracts PersianDateComponents from a timestamp or Date instance
 */
export function getPersianDate(timestampMillis: number | Date = Date.now()): PersianDateComponents {
  const d = typeof timestampMillis === 'number' ? new Date(timestampMillis) : timestampMillis;
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();

  // JavaScript getDay(): 0 = Sunday (یکشنبه), 6 = Saturday (شنبه)
  const dayOfWeekIndex = d.getDay();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  const monthName = jm >= 1 && jm <= 12 ? PERSIAN_MONTH_NAMES[jm - 1] : '';
  const dayOfWeekName = dayOfWeekIndex >= 0 && dayOfWeekIndex < PERSIAN_WEEKDAYS.length ? PERSIAN_WEEKDAYS[dayOfWeekIndex] : '';

  return {
    year: jy,
    month: jm,
    day: jd,
    monthName,
    dayOfWeekName,
    hour,
    minute,
    second,
  };
}

/**
 * Formats a timestamp into a human-readable Persian date string
 * Example: "دوشنبه ۱۷ شهریور ۱۴۰۵ | ۱۷:۲۲"
 */
export function formatPersianDate(
  timestampMillis: number | Date = Date.now(),
  includeTime: boolean = true,
  usePersianDigits: boolean = true
): string {
  const p = getPersianDate(timestampMillis);
  const dStr = usePersianDigits ? toPersianDigits(p.day) : p.day.toString();
  const yStr = usePersianDigits ? toPersianDigits(p.year) : p.year.toString();
  const hPad = p.hour.toString().padStart(2, '0');
  const mPad = p.minute.toString().padStart(2, '0');
  const hStr = usePersianDigits ? toPersianDigits(hPad) : hPad;
  const mStr = usePersianDigits ? toPersianDigits(mPad) : mPad;

  if (includeTime) {
    return `${p.dayOfWeekName} ${dStr} ${p.monthName} ${yStr} | ${hStr}:${mStr}`;
  }
  return `${p.dayOfWeekName} ${dStr} ${p.monthName} ${yStr}`;
}

/**
 * Generates an automated timestamped backup filename
 * Example: "AssetTree_Backup_1405_06_17_1722.json"
 */
export function getPersianBackupFileName(timestampMillis: number = Date.now()): string {
  const p = getPersianDate(timestampMillis);
  const mStr = p.month.toString().padStart(2, '0');
  const dStr = p.day.toString().padStart(2, '0');
  const hStr = p.hour.toString().padStart(2, '0');
  const minStr = p.minute.toString().padStart(2, '0');
  return `AssetTree_Backup_${p.year}_${mStr}_${dStr}_${hStr}${minStr}.json`;
}
