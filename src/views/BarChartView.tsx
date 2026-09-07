import React, { useState, useMemo } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import {
  formatCurrency,
  formatPercentage,
  formatNumberWithCommas,
} from '../utils/numberFormat';
import { ArrowDownWideNarrow, Layers, Tag } from 'lucide-react';

interface BarChartProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onSelectNodeDetails: (node: CalculatedNode) => void;
}

export const BarChartView: React.FC<BarChartProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
}) => {
  const [viewLevel, setViewLevel] = useState<'CATEGORIES' | 'LEAF_ASSETS'>('CATEGORIES');
  const [sortDirection, setSortDirection] = useState<'DESC' | 'ASC'>('DESC');
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  // Extract items based on viewLevel
  const items = useMemo(() => {
    let list: CalculatedNode[] = [];
    if (viewLevel === 'CATEGORIES') {
      list = [...rootCalculated.children];
    } else {
      const leaves: CalculatedNode[] = [];
      const traverse = (node: CalculatedNode) => {
        if (!node.isGroup && node.depth > 0) {
          leaves.push(node);
        }
        node.children.forEach(traverse);
      };
      traverse(rootCalculated);
      list = leaves;
    }

    list.sort((a, b) => {
      return sortDirection === 'DESC'
        ? b.totalValue - a.totalValue
        : a.totalValue - b.totalValue;
    });

    return list;
  }, [rootCalculated, viewLevel, sortDirection]);

  const maxVal = useMemo(() => {
    return items.reduce((max, it) => Math.max(max, it.totalValue), 1);
  }, [items]);

  return (
    <div className="w-full pb-16 flex flex-col">
      {/* Control Toolbar */}
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          {/* Level Switcher */}
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              id="btn-bar-level-categories"
              onClick={() => setViewLevel('CATEGORIES')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-all cursor-pointer ${
                viewLevel === 'CATEGORIES'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isEn ? 'Main Categories' : 'دسته‌بندی‌های اصلی'}</span>
            </button>

            <button
              type="button"
              id="btn-bar-level-leaves"
              onClick={() => setViewLevel('LEAF_ASSETS')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-all cursor-pointer ${
                viewLevel === 'LEAF_ASSETS'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{isEn ? 'All Leaf Assets' : 'کل دارایی‌های منفرد'}</span>
            </button>
          </div>
        </div>

        {/* Sort toggle */}
        <button
          type="button"
          id="btn-bar-sort-dir"
          onClick={() => setSortDirection(sortDirection === 'DESC' ? 'ASC' : 'DESC')}
          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-[11px] sm:text-xs cursor-pointer"
        >
          <ArrowDownWideNarrow className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            {isEn
              ? `Sort: ${sortDirection === 'DESC' ? 'Highest to Lowest' : 'Lowest to Highest'}`
              : `مرتب‌سازی: ${sortDirection === 'DESC' ? 'بیشترین به کمترین' : 'کمترین به بیشترین'}`}
          </span>
        </button>
      </div>

      {/* Bars Container */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2.5 sm:gap-4">
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            {isEn ? 'No assets found to display' : 'دارایی برای نمایش وجود ندارد'}
          </div>
        ) : (
          items.map((node) => {
            const palette = getPaletteForNode(node.name, node.categoryTag, settings.customAssetColors);
            const barWidthPercent = Math.max(2, (node.totalValue / maxVal) * 100);

            return (
              <div
                key={node.id}
                id={`bar-item-${node.id}`}
                onClick={() => onSelectNodeDetails(node)}
                className="flex flex-col gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
                      {node.name}
                    </span>
                    {!node.isGroup && node.quantity > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:inline">
                        ({formatNumberWithCommas(node.quantity, settings.usePersianDigits, 2, lang)} {node.unit})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatCurrency(
                        node.totalValue,
                        settings.currencyUnit,
                        settings.compactCurrency,
                        settings.usePersianDigits,
                        settings.privacyMode,
                        lang
                      )}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 min-w-8 sm:min-w-10 text-left">
                      {formatPercentage(node.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
                    </span>
                  </div>
                </div>

                {/* Bar line */}
                <div className="w-full h-2.5 sm:h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidthPercent}%`,
                      backgroundColor: palette.primary,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
