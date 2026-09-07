import React, { useState, useMemo } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import { formatCurrency, formatPercentage } from '../utils/numberFormat';

interface PieChartProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onSelectNodeDetails: (node: CalculatedNode) => void;
}

export const PieChartView: React.FC<PieChartProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
}) => {
  const [hoveredNode, setHoveredNode] = useState<CalculatedNode | null>(null);
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  const categories = useMemo(() => {
    return [...rootCalculated.children].filter((c) => c.totalValue > 0);
  }, [rootCalculated]);

  const totalPortfolioValue = rootCalculated.totalValue;

  // Arc calculation for donut
  const slices = useMemo(() => {
    let currentAngle = 0;
    return categories.map((cat) => {
      const fraction = totalPortfolioValue > 0 ? cat.totalValue / totalPortfolioValue : 0;
      const angle = fraction * 2 * Math.PI;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;

      const palette = getPaletteForNode(cat.name, cat.categoryTag, settings.customAssetColors);

      return {
        node: cat,
        fraction,
        start,
        end,
        color: palette.primary,
      };
    });
  }, [categories, totalPortfolioValue, settings.customAssetColors]);

  const createDonutPath = (
    cx: number,
    cy: number,
    rInner: number,
    rOuter: number,
    a0: number,
    a1: number
  ): string => {
    const diff = a1 - a0;
    const safeDiff = diff >= 2 * Math.PI - 0.0001 ? 2 * Math.PI - 0.0001 : diff;
    const end = a0 + safeDiff;

    const x1 = cx + rOuter * Math.cos(a0);
    const y1 = cy + rOuter * Math.sin(a0);
    const x2 = cx + rOuter * Math.cos(end);
    const y2 = cy + rOuter * Math.sin(end);

    const x3 = cx + rInner * Math.cos(end);
    const y3 = cy + rInner * Math.sin(end);
    const x4 = cx + rInner * Math.cos(a0);
    const y4 = cy + rInner * Math.sin(a0);

    const largeArc = safeDiff > Math.PI ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  };

  const activeNode = hoveredNode;

  return (
    <div className="w-full pb-16 flex flex-col items-center">
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* SVG Donut */}
        <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center">
          <svg viewBox="-180 -180 360 360" className="w-full h-full transform -rotate-90 select-none">
            <g>
              {slices.map((slice, idx) => {
                const isHovered = hoveredNode?.id === slice.node.id;
                const rIn = 95;
                const rOut = isHovered ? 165 : 155;

                return (
                  <path
                    key={slice.node.id}
                    d={createDonutPath(0, 0, rIn, rOut, slice.start, slice.end)}
                    fill={slice.color}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="2"
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity: hoveredNode && !isHovered ? 0.6 : 1,
                    }}
                    onMouseEnter={() => setHoveredNode(slice.node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onSelectNodeDetails(slice.node)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Center Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {activeNode ? activeNode.name : (isEn ? 'Total Portfolio Value' : 'ارزش کل پورتفو')}
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(
                activeNode ? activeNode.totalValue : totalPortfolioValue,
                settings.currencyUnit,
                true,
                settings.usePersianDigits,
                settings.privacyMode,
                lang
              )}
            </span>
            {activeNode && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {formatPercentage(
                  activeNode.percentOfTotal,
                  settings.decimalPlaces,
                  settings.usePersianDigits,
                  lang
                )}
              </span>
            )}
          </div>
        </div>

        {/* Categories Legend & Breakdown List */}
        <div className="flex-1 w-full flex flex-col gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            {isEn ? 'Asset Distribution by Category' : 'توزیع دارایی‌ها بر اساس دسته‌بندی'}
          </h2>

          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const palette = getPaletteForNode(cat.name, cat.categoryTag, settings.customAssetColors);
              const isHovered = hoveredNode?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectNodeDetails(cat)}
                  onMouseEnter={() => setHoveredNode(cat)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isHovered
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      {formatCurrency(
                        cat.totalValue,
                        settings.currencyUnit,
                        true,
                        settings.usePersianDigits,
                        settings.privacyMode,
                        lang
                      )}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 min-w-9 text-left">
                      {formatPercentage(cat.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
