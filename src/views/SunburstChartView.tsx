import React, { useState, useMemo } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import { formatCurrency, formatPercentage } from '../utils/numberFormat';
import { ZoomOut, Info } from 'lucide-react';

interface SunburstProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onSelectNodeDetails: (node: CalculatedNode) => void;
}

interface RadialSlice {
  node: CalculatedNode;
  level: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
}

export const SunburstChartView: React.FC<SunburstProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
}) => {
  const [activeRoot, setActiveRoot] = useState<CalculatedNode>(rootCalculated);
  const [hoveredNode, setHoveredNode] = useState<CalculatedNode | null>(null);
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  // Keep activeRoot in sync if tree updates
  const currentRoot = useMemo(() => {
    const findNode = (n: CalculatedNode, id: string): CalculatedNode | null => {
      if (n.id === id) return n;
      for (const child of n.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    };
    return findNode(rootCalculated, activeRoot.id) || rootCalculated;
  }, [rootCalculated, activeRoot.id]);

  const slices = useMemo(() => {
    const list: RadialSlice[] = [];
    const rootTotal = currentRoot.totalValue;
    if (rootTotal <= 0) return list;

    // Radius configurations
    const r0 = 65; // Inner center circle
    const r1 = 140; // Ring 1
    const r2 = 210; // Ring 2

    // Level 1 slices
    let currentAngle = 0;
    for (const child of currentRoot.children) {
      if (child.totalValue <= 0) continue;
      const fraction = child.totalValue / rootTotal;
      const sweep = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle = endAngle;

      const palette = getPaletteForNode(child.name, child.categoryTag, settings.customAssetColors);

      list.push({
        node: child,
        level: 1,
        startAngle,
        endAngle,
        innerRadius: r0 + 4,
        outerRadius: r1,
        color: palette.primary,
      });

      // Level 2 slices (grand-children)
      if (child.children.length > 0 && child.totalValue > 0) {
        let childAngle = startAngle;
        for (const grandChild of child.children) {
          if (grandChild.totalValue <= 0) continue;
          const grandFraction = grandChild.totalValue / child.totalValue;
          const grandSweep = grandFraction * sweep;
          const gStart = childAngle;
          const gEnd = childAngle + grandSweep;
          childAngle = gEnd;

          list.push({
            node: grandChild,
            level: 2,
            startAngle: gStart,
            endAngle: gEnd,
            innerRadius: r1 + 3,
            outerRadius: r2,
            color: palette.lightTint,
          });
        }
      }
    }

    return list;
  }, [currentRoot, settings.customAssetColors]);

  // SVG Arc generator
  const getArcD = (
    rInner: number,
    rOuter: number,
    a0: number,
    a1: number
  ): string => {
    const diff = a1 - a0;
    const safeDiff = diff >= 2 * Math.PI - 0.0001 ? 2 * Math.PI - 0.0001 : diff;
    const end = a0 + safeDiff;

    const x1 = rOuter * Math.cos(a0);
    const y1 = rOuter * Math.sin(a0);
    const x2 = rOuter * Math.cos(end);
    const y2 = rOuter * Math.sin(end);

    const x3 = rInner * Math.cos(end);
    const y3 = rInner * Math.sin(end);
    const x4 = rInner * Math.cos(a0);
    const y4 = rInner * Math.sin(a0);

    const largeArc = safeDiff > Math.PI ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  };

  const handleSliceClick = (node: CalculatedNode) => {
    if (node.isGroup && node.children.length > 0) {
      setActiveRoot(node);
    } else {
      onSelectNodeDetails(node);
    }
  };

  const displayNode = hoveredNode || currentRoot;

  return (
    <div className="w-full pb-16 flex flex-col items-center">
      {/* Sunburst Canvas Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
        {/* Reset Zoom Button */}
        {currentRoot.id !== rootCalculated.id && (
          <button
            type="button"
            onClick={() => setActiveRoot(rootCalculated)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition-colors text-[11px] sm:text-xs font-semibold cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span>{isEn ? 'Reset to Root' : 'بازگشت به ریشه'}</span>
          </button>
        )}

        {/* SVG Sunburst */}
        <div className="relative w-full aspect-square max-w-[480px] flex items-center justify-center my-1 sm:my-2">
          <svg
            viewBox="-240 -240 480 480"
            className="w-full h-full transform -rotate-90 select-none"
          >
            <g>
              {slices.map((slice, i) => {
                const isHovered = hoveredNode?.id === slice.node.id;
                return (
                  <path
                    key={`${slice.node.id}-${slice.level}-${i}`}
                    d={getArcD(
                      slice.innerRadius,
                      slice.outerRadius,
                      slice.startAngle,
                      slice.endAngle
                    )}
                    fill={slice.color}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.5"
                    className="transition-all duration-150 cursor-pointer hover:opacity-90"
                    style={{
                      opacity: isHovered ? 1 : 0.88,
                      filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : undefined,
                    }}
                    onMouseEnter={() => setHoveredNode(slice.node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleSliceClick(slice.node)}
                  />
                );
              })}

              {/* Center Circle (Root / Active Node) */}
              <circle
                r="62"
                cx="0"
                cy="0"
                className="fill-white dark:fill-slate-800 stroke-blue-500/30 stroke-2 cursor-pointer transition-colors hover:fill-blue-50 dark:hover:fill-slate-700"
                onClick={() => {
                  if (currentRoot.id !== rootCalculated.id) {
                    setActiveRoot(rootCalculated);
                  } else {
                    onSelectNodeDetails(currentRoot);
                  }
                }}
              />
            </g>
          </svg>

          {/* Center Text Overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 max-w-[105px] sm:max-w-[125px] mx-auto"
          >
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full">
              {currentRoot.name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {formatCurrency(
                currentRoot.totalValue,
                settings.currencyUnit,
                true,
                settings.usePersianDigits,
                settings.privacyMode,
                lang
              )}
            </span>
          </div>
        </div>

        {/* Hovered / Active Node Inspector Panel */}
        <div className="w-full mt-3 sm:mt-4 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
                {displayNode.name}
              </span>
              {displayNode.isGroup && (
                <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {displayNode.children.length} {isEn ? 'sub-branches' : 'زیرشاخه'}
                </span>
              )}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs mt-0.5 truncate">
              {isEn ? 'Value: ' : 'ارزش: '}{formatCurrency(displayNode.totalValue, settings.currencyUnit, true, settings.usePersianDigits, settings.privacyMode, lang)} ({isEn ? 'Share: ' : 'سهم: '}{formatPercentage(displayNode.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)})
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectNodeDetails(displayNode)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 text-[11px] sm:text-xs cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{isEn ? 'Details' : 'شناسنامه'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
