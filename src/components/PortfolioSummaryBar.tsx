import React, { useState } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { TreeEngine } from '../core/TreeEngine';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  PieChart,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

interface PortfolioSummaryBarProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onOpenAddRootAsset: () => void;
  onOpenChart: () => void;
}

export const PortfolioSummaryBar: React.FC<PortfolioSummaryBarProps> = ({
  rootCalculated,
  settings,
  onOpenAddRootAsset,
  onOpenChart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const health = TreeEngine.performTreeHealthCheck(rootCalculated);
  const directChildren = rootCalculated.children;
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const tSummary = TRANSLATIONS.summary;

  // Largest category
  const topCategory = React.useMemo(() => {
    if (directChildren.length === 0) return null;
    return [...directChildren].sort((a, b) => b.totalValue - a.totalValue)[0];
  }, [directChildren]);

  return (
    <div className="w-full mb-4 sm:mb-6">
      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-r from-blue-700 via-indigo-800 to-slate-900 text-white shadow-md transition-all">
        {/* Subtle background ornamentation */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative p-4 sm:p-6">
          {/* Top header line: Title & Health Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <Wallet className="w-4 h-4 text-blue-200" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-100/90">
                {tSummary.totalValue[lang]}
              </span>
            </div>

            {/* Tree Health Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-xs transition-colors ${
                health.isValid
                  ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30'
              }`}
              title={
                health.isValid
                  ? (isEn ? 'All bottom-up computations are balanced and audited' : 'تمام محاسبات پایین‌به‌بالا دقیق و تراز است')
                  : `${isEn ? 'Discrepancy: ' : 'مغایرت محاسباتی به میزان '}${formatCurrency(
                      health.discrepancy,
                      settings.currencyUnit,
                      false,
                      settings.usePersianDigits,
                      false,
                      lang
                    )}`
              }
            >
              {health.isValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'Audit Verified' : 'محاسبات تراز'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isEn ? 'Discrepancy' : 'دارای مغایرت'}</span>
                </>
              )}
            </div>
          </div>

          {/* Main Total Value Display */}
          <div className="flex flex-wrap items-baseline justify-between gap-4 mt-1">
            <div>
              <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-xs">
                {formatCurrency(
                  rootCalculated.totalValue,
                  settings.currencyUnit,
                  false,
                  settings.usePersianDigits,
                  settings.privacyMode,
                  lang
                )}
              </div>
              <div className="text-xs text-blue-200/80 mt-1 flex items-center gap-2">
                <span>
                  {isEn
                    ? `Total ${formatNumberWithCommas(health.totalNodeCount - 1, settings.usePersianDigits, 0, lang)} assets & sub-items`
                    : `مجموع ${formatNumberWithCommas(health.totalNodeCount - 1, settings.usePersianDigits, 0, lang)} دارایی و زیرمجموعه`}
                </span>
                {topCategory && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs">
                      {isEn ? `Top group: ${topCategory.name}` : `بزرگ‌ترین گروه: ${topCategory.name}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-add-root-asset"
                onClick={onOpenAddRootAsset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-98 text-white text-xs sm:text-sm font-semibold transition-all backdrop-blur-xs shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-blue-200" />
                <span>{tSummary.addAsset[lang]}</span>
              </button>

              <button
                type="button"
                id="btn-quick-chart"
                onClick={onOpenChart}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-white text-xs sm:text-sm font-medium transition-all backdrop-blur-xs cursor-pointer"
                title={isEn ? 'View in Chart format' : 'مشاهده در قالب نمودار'}
              >
                <PieChart className="w-4 h-4 text-blue-200" />
                <span className="hidden sm:inline">{isEn ? 'Charts' : 'نمودار'}</span>
              </button>

              <button
                type="button"
                id="btn-toggle-stats"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isEn ? 'More Statistics' : 'جزئیات آماری بیشتر'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expandable Health & Allocation breakdown drawer */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block mb-1">
                  {isEn ? 'Level 1 Categories' : 'دسته‌بندی‌های سطح ۱'}
                </span>
                <span className="text-sm font-bold text-white">
                  {formatNumberWithCommas(directChildren.length, settings.usePersianDigits, 0, lang)} {isEn ? 'groups' : 'دسته'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block mb-1">
                  {isEn ? 'Total Nodes Count' : 'تعداد کل گره‌ها'}
                </span>
                <span className="text-sm font-bold text-white">
                  {formatNumberWithCommas(health.totalNodeCount, settings.usePersianDigits, 0, lang)} {isEn ? 'nodes' : 'گره'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block mb-1">
                  {isEn ? 'Zero Value Items' : 'دارایی‌های با ارزش صفر'}
                </span>
                <span className={`text-sm font-bold ${health.zeroValueCount > 0 ? 'text-amber-300' : 'text-white'}`}>
                  {formatNumberWithCommas(health.zeroValueCount, settings.usePersianDigits, 0, lang)} {isEn ? 'items' : 'مورد'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block mb-1">
                  {isEn ? 'Audit Discrepancy' : 'مغایرت پایینی'}
                </span>
                <span className={`text-sm font-bold ${health.discrepancy > 0.1 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {health.discrepancy < 0.1
                    ? (isEn ? 'Zero (Balanced)' : 'صفر (کامل)')
                    : formatCurrency(health.discrepancy, settings.currencyUnit, true, settings.usePersianDigits, false, lang)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
