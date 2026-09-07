import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { AppLanguage } from '../types';
import { getPersianDate } from '../utils/persianDate';
import { toPersianDigits } from '../utils/numberFormat';

interface LiveDateTimeProps {
  language: AppLanguage;
  usePersianDigits?: boolean;
}

export const LiveDateTime: React.FC<LiveDateTimeProps> = ({
  language = 'fa',
  usePersianDigits = true,
}) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isEn = language === 'en';

  // Persian representation
  const p = getPersianDate(now);
  const hPad = p.hour.toString().padStart(2, '0');
  const mPad = p.minute.toString().padStart(2, '0');
  const sPad = p.second.toString().padStart(2, '0');

  const faTimeStr = usePersianDigits
    ? `${toPersianDigits(hPad)}:${toPersianDigits(mPad)}:${toPersianDigits(sPad)}`
    : `${hPad}:${mPad}:${sPad}`;
  const faTimeShort = usePersianDigits
    ? `${toPersianDigits(hPad)}:${toPersianDigits(mPad)}`
    : `${hPad}:${mPad}`;
  const faDay = usePersianDigits ? toPersianDigits(p.day) : p.day;
  const faYear = usePersianDigits ? toPersianDigits(p.year) : p.year;
  const faDateFull = `${p.dayOfWeekName} ${faDay} ${p.monthName} ${faYear}`;
  const faDateMedium = `${faDay} ${p.monthName}`;

  // English representation
  const enHours = now.getHours().toString().padStart(2, '0');
  const enMins = now.getMinutes().toString().padStart(2, '0');
  const enSecs = now.getSeconds().toString().padStart(2, '0');
  const enTimeStr = `${enHours}:${enMins}:${enSecs}`;
  const enTimeShort = `${enHours}:${enMins}`;
  const enDateFull = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const enDateMedium = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const displayTime = isEn ? enTimeShort : faTimeShort;
  const displayDateFull = isEn ? enDateFull : faDateFull;
  const displayDateMedium = isEn ? enDateMedium : faDateMedium;
  const tooltipText = isEn
    ? `${enDateFull} - ${enTimeStr}`
    : `${faDateFull} - ساعت ${faTimeStr}`;

  return (
    <div
      id="live-date-time-widget"
      title={tooltipText}
      className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-750/90 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors select-none cursor-default shrink-0"
    >
      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
      <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold leading-none">
        {/* Live Clock */}
        <span className="tabular-nums text-slate-800 dark:text-slate-100 font-bold">
          {displayTime}
        </span>
        <span className="text-slate-300 dark:text-slate-600 font-light select-none">|</span>
        {/* Date on desktop (full) */}
        <span className="hidden md:inline text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">
          {displayDateFull}
        </span>
        {/* Date on mobile/tablet (compact) */}
        <span className="md:hidden text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {displayDateMedium}
        </span>
      </div>
    </div>
  );
};
