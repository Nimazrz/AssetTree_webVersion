import React, { useState, useMemo, useRef } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import { formatCurrency, formatPercentage } from '../utils/numberFormat';
import { Info, Check, Eye } from 'lucide-react';

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
  const [selectedNode, setSelectedNode] = useState<CalculatedNode | null>(null);
  const lastClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
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

      // Mid-point calculation for labels on pie chart
      const midAngle = (start + end) / 2;
      const rInner = 95;
      const rOuter = 160;
      const rLabel = (rInner + rOuter) / 2;
      const labelX = rLabel * Math.cos(midAngle);
      const labelY = rLabel * Math.sin(midAngle);

      return {
        node: cat,
        fraction,
        start,
        end,
        angle,
        midAngle,
        labelX,
        labelY,
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

  const activeNode = hoveredNode || selectedNode;

  // Vazife 8: 1 click/tap selects/pins, 2 clicks/taps opens properties and details menu
  const handleSliceClick = (node: CalculatedNode) => {
    const now = Date.now();
    if (lastClickRef.current.id === node.id && now - lastClickRef.current.time < 380) {
      onSelectNodeDetails(node);
      lastClickRef.current = { id: '', time: 0 };
      return;
    }

    lastClickRef.current = { id: node.id, time: now };
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
    }
  };

  return (
    <div className="w-full pb-16 flex flex-col items-center">
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8">
        {/* SVG Donut */}
        <div className="relative w-full aspect-square max-w-[320px] xs:max-w-[360px] sm:max-w-[400px] flex items-center justify-center">
          <svg viewBox="-190 -190 380 380" className="w-full h-full transform -rotate-90 select-none">
            <g>
              {slices.map((slice) => {
                const isHovered = hoveredNode?.id === slice.node.id;
                const isSelected = selectedNode?.id === slice.node.id;
                const rIn = 95;
                const rOut = isHovered || isSelected ? 172 : 158;

                return (
                  <path
                    key={slice.node.id}
                    d={createDonutPath(0, 0, rIn, rOut, slice.start, slice.end)}
                    fill={slice.color}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={isSelected ? '3' : '2'}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity: (hoveredNode || selectedNode) && !isHovered && !isSelected ? 0.5 : 1,
                      filter: isSelected ? 'drop-shadow(0px 2px 6px rgba(0,0,0,0.3))' : undefined,
                    }}
                    onMouseEnter={() => setHoveredNode(slice.node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleSliceClick(slice.node)}
                  />
                );
              })}

              {/* Text labels on slices: "روی نمودار دایره درصد نام دارایی" */}
              {slices.map((slice) => {
                // Only display text if slice is wide enough (> 14 degrees / 0.25 radians)
                if (slice.angle < 0.22) return null;
                const percentStr = `${Math.round(slice.fraction * 100)}٪`;
                const labelText = `${slice.node.name} (${percentStr})`;

                return (
                  <g
                    key={`label-${slice.node.id}`}
                    transform={`translate(${slice.labelX}, ${slice.labelY}) rotate(90)`}
                    className="pointer-events-none select-none"
                  >
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-bold text-[10px] sm:text-[11px]"
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'rgba(15, 23, 42, 0.85)',
                        strokeWidth: '2.5px',
                        strokeLinejoin: 'round',
                      }}
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Center Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 max-w-[170px] mx-auto">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate w-full">
              {activeNode ? activeNode.name : (isEn ? 'Total Portfolio Value' : 'ارزش کل پورتفو')}
            </span>
            <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white mt-0.5 truncate w-full">
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
              <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
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

        {/* Categories Legend & Details Inspector */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isEn ? 'Asset Distribution by Category' : 'توزیع دارایی‌ها بر اساس دسته‌بندی'}
            </h2>
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Click to inspect' : 'کلیک جهت انتخاب و بررسی'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2 max-h-[280px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const palette = getPaletteForNode(cat.name, cat.categoryTag, settings.customAssetColors);
              const isHovered = hoveredNode?.id === cat.id;
              const isSelected = selectedNode?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleSliceClick(cat)}
                  onMouseEnter={() => setHoveredNode(cat)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs'
                      : isHovered
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                    <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 min-w-8 sm:min-w-9 text-left">
                      {formatPercentage(cat.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Item Inspector Bar (Explicit button to open full details - avoids single click popup) */}
          {selectedNode && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {selectedNode.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatCurrency(selectedNode.totalValue, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}{' '}
                  ({formatPercentage(selectedNode.percentOfTotal, 1, settings.usePersianDigits, lang)})
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectNodeDetails(selectedNode)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isEn ? 'View Details' : 'مشاهده شناسنامه کامل'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
