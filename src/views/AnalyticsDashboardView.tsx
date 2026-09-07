import React, { useMemo } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { TreeEngine } from '../core/TreeEngine';
import { getPaletteForNode } from '../utils/assetColors';
import {
  formatCurrency,
  formatPercentage,
  formatNumberWithCommas,
} from '../utils/numberFormat';
import {
  AlertCircle,
  Award,
  Layers,
  PieChart,
  Download,
  ShieldCheck,
  Printer,
} from 'lucide-react';

interface AnalyticsProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onSelectNodeDetails: (node: CalculatedNode) => void;
  onExportBackup: () => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
  onExportBackup,
}) => {
  const health = TreeEngine.performTreeHealthCheck(rootCalculated);
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  // Top 5 Holdings (Leaf nodes)
  const topHoldings = useMemo(() => {
    const leaves: CalculatedNode[] = [];
    const traverse = (n: CalculatedNode) => {
      if (!n.isGroup && n.depth > 0 && n.totalValue > 0) {
        leaves.push(n);
      }
      n.children.forEach(traverse);
    };
    traverse(rootCalculated);
    return leaves.sort((a, b) => b.totalValue - a.totalValue).slice(0, 5);
  }, [rootCalculated]);

  // Depth statistics
  const depthStats = useMemo(() => {
    const counts: Record<number, number> = {};
    const traverse = (n: CalculatedNode) => {
      counts[n.depth] = (counts[n.depth] || 0) + 1;
      n.children.forEach(traverse);
    };
    traverse(rootCalculated);
    return counts;
  }, [rootCalculated]);

  return (
    <div className="w-full pb-16 flex flex-col gap-6">
      {/* Top Banner: Tree Health & Mathematical Integrity */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          health.isValid
            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                health.isValid
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {health.isValid ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {health.isValid
                  ? (isEn ? 'Bottom-up audit is fully verified and mathematically sound' : 'محاسبات پایین‌به‌بالا کاملاً تراز و معتبر است')
                  : (isEn ? 'Mathematical discrepancy found in hierarchy' : 'مغایرت در محاسبات سلسله‌مراتبی یافت شد')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {isEn ? 'Root Total: ' : 'ارزش ریشه: '}
                {formatCurrency(health.rootTotal, settings.currencyUnit, false, settings.usePersianDigits, settings.privacyMode, lang)} |{' '}
                {isEn ? 'Direct Children Sum: ' : 'مجموع فرزندان مستقیم: '}
                {formatCurrency(health.directChildrenSum, settings.currencyUnit, false, settings.usePersianDigits, settings.privacyMode, lang)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-print-portfolio-report"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
              title={isEn ? 'Print or Save Report as PDF' : 'چاپ یا ذخیره گزارش به‌صورت PDF'}
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isEn ? 'Print / PDF' : 'چاپ / گزارش PDF'}</span>
            </button>

            <button
              type="button"
              id="btn-export-backup-json"
              onClick={onExportBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isEn ? 'Export (JSON)' : 'خروجی (JSON)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Top 5 Holdings & Group Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Holdings Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {isEn ? 'Top 5 Holdings by Total Value' : '۵ دارایی برتر از نظر ارزش مالی'}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {topHoldings.map((leaf, index) => {
              return (
                <div
                  key={leaf.id}
                  onClick={() => onSelectNodeDetails(leaf)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-xs">
                      {formatNumberWithCommas(index + 1, settings.usePersianDigits, 0, lang)}
                    </span>
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                      {leaf.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {formatCurrency(
                        leaf.totalValue,
                        settings.currencyUnit,
                        true,
                        settings.usePersianDigits,
                        settings.privacyMode,
                        lang
                      )}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {formatPercentage(leaf.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Distribution Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {isEn ? 'Percentage Allocation by Category' : 'توزیع درصدی گروه‌های دارایی'}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {rootCalculated.children.map((group) => {
              const palette = getPaletteForNode(group.name, group.categoryTag, settings.customAssetColors);

              return (
                <div
                  key={group.id}
                  onClick={() => onSelectNodeDetails(group)}
                  className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {group.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(
                          group.totalValue,
                          settings.currencyUnit,
                          true,
                          settings.usePersianDigits,
                          settings.privacyMode,
                          lang
                        )}
                      </span>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {formatPercentage(group.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(1, group.percentOfTotal))}%`,
                        backgroundColor: palette.primary,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hierarchy Depth Statistics */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
            {isEn ? 'Tree Depth Distribution' : 'آمار سطوح عمق درخت (Tree Depth Distribution)'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {isEn ? 'Total Registered Nodes' : 'کل گره‌های ثبت شده'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatNumberWithCommas(health.totalNodeCount, settings.usePersianDigits, 0, lang)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {isEn ? 'Level 1 Categories' : 'دسته‌های سطح ۱'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatNumberWithCommas(depthStats[1] || 0, settings.usePersianDigits, 0, lang)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {isEn ? 'Sub-branches (L2+)' : 'زیرشاخه‌ها (سطح ۲ و عمیق‌تر)'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatNumberWithCommas(
                (health.totalNodeCount - 1) - (depthStats[1] || 0),
                settings.usePersianDigits,
                0,
                lang
              )}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {isEn ? 'Zero Value Items' : 'دارایی‌های با ارزش صفر'}
            </span>
            <span className={`text-xl sm:text-2xl font-black ${health.zeroValueCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
              {formatNumberWithCommas(health.zeroValueCount, settings.usePersianDigits, 0, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
