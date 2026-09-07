import React, { useState, useMemo } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import { formatCurrency, formatPercentage } from '../utils/numberFormat';
import { ChevronRight, ChevronLeft, Home, ZoomIn, Info } from 'lucide-react';

interface TreemapProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onSelectNodeDetails: (node: CalculatedNode) => void;
}

interface TreemapRect {
  node: CalculatedNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TreemapChartView: React.FC<TreemapProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
}) => {
  const [drilldownPath, setDrilldownPath] = useState<CalculatedNode[]>([rootCalculated]);
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';

  const currentNode = drilldownPath[drilldownPath.length - 1] || rootCalculated;

  // Squarified/Slice layout algorithm for the current children
  const tiles: TreemapRect[] = useMemo(() => {
    const items = currentNode.children.filter((c) => c.totalValue > 0);
    if (items.length === 0) return [];

    const totalVal = items.reduce((s, it) => s + it.totalValue, 0);
    if (totalVal <= 0) return [];

    // Simple robust squarified layout in 100x100 space
    const sorted = [...items].sort((a, b) => b.totalValue - a.totalValue);

    const layoutRectangles = (
      nodes: CalculatedNode[],
      x: number,
      y: number,
      w: number,
      h: number
    ): TreemapRect[] => {
      if (nodes.length === 0) return [];
      if (nodes.length === 1) {
        return [{ node: nodes[0], x, y, width: w, height: h }];
      }

      const sum = nodes.reduce((acc, n) => acc + n.totalValue, 0);
      let halfSum = 0;
      let splitIdx = 0;

      for (let i = 0; i < nodes.length; i++) {
        halfSum += nodes[i].totalValue;
        if (halfSum >= sum / 2 || i === nodes.length - 2) {
          splitIdx = i + 1;
          break;
        }
      }

      const g1 = nodes.slice(0, splitIdx);
      const g2 = nodes.slice(splitIdx);
      const sum1 = g1.reduce((acc, n) => acc + n.totalValue, 0);
      const ratio = sum > 0 ? sum1 / sum : 0.5;

      if (w >= h) {
        // Vertical split
        const w1 = w * ratio;
        const w2 = w - w1;
        return [
          ...layoutRectangles(g1, x, y, w1, h),
          ...layoutRectangles(g2, x + w1, y, w2, h),
        ];
      } else {
        // Horizontal split
        const h1 = h * ratio;
        const h2 = h - h1;
        return [
          ...layoutRectangles(g1, x, y, w, h1),
          ...layoutRectangles(g2, x, y + h1, w, h2),
        ];
      }
    };

    return layoutRectangles(sorted, 0, 0, 100, 100);
  }, [currentNode]);

  const handleTileClick = (node: CalculatedNode) => {
    if (node.isGroup && node.children.length > 0) {
      setDrilldownPath((prev) => [...prev, node]);
    } else {
      onSelectNodeDetails(node);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setDrilldownPath((prev) => prev.slice(0, index + 1));
  };

  return (
    <div className="w-full pb-16 flex flex-col">
      {/* Breadcrumb Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setDrilldownPath([rootCalculated])}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold cursor-pointer"
          >
            <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isEn ? 'Portfolio Root' : 'ریشه پورتفو'}</span>
          </button>

          {drilldownPath.slice(1).map((node, i) => (
            <React.Fragment key={node.id}>
              {isRtl ? (
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <button
                type="button"
                onClick={() => handleBreadcrumbClick(i + 1)}
                className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] sm:text-xs transition-colors cursor-pointer ${
                  i === drilldownPath.length - 2
                    ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {node.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>
            {isEn
              ? `Sub-items: ${tiles.length}`
              : `تعداد اقلام: ${tiles.length}`}
          </span>
        </div>
      </div>

      {/* Treemap Container */}
      <div className="relative w-full h-[360px] xs:h-[420px] sm:h-[480px] md:h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5 shadow-inner">
        {tiles.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm">
            <span>{isEn ? 'No valid sub-items found to display' : 'هیچ زیرمجموعه یا دارایی معتبری برای نمایش وجود ندارد'}</span>
          </div>
        ) : (
          tiles.map(({ node, x, y, width, height }) => {
            const palette = getPaletteForNode(node.name, node.categoryTag, settings.customAssetColors);
            const isLarge = width > 18 && height > 15;
            const isMedium = width > 12 && height > 10;

            return (
              <div
                key={node.id}
                onClick={() => handleTileClick(node)}
                className="absolute p-0.5 sm:p-1 transition-transform duration-150 hover:z-10 group cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
              >
                <div
                  className="w-full h-full rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between overflow-hidden shadow-xs border border-white/20 hover:scale-[1.01] transition-all"
                  style={{
                    backgroundColor: palette.primary,
                    color: '#ffffff',
                  }}
                >
                  {/* Top: Name & Zoom icon */}
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`font-bold leading-snug drop-shadow-xs truncate ${
                        isLarge ? 'text-xs sm:text-sm' : isMedium ? 'text-[10px] sm:text-[11px]' : 'text-[9px]'
                      }`}
                    >
                      {node.name}
                    </span>

                    {node.isGroup && isLarge && (
                      <ZoomIn className="w-3.5 h-3.5 opacity-80 shrink-0" />
                    )}
                  </div>

                  {/* Middle / Bottom: Values & Percentage */}
                  {isMedium && (
                    <div className="mt-auto pt-1 flex flex-col">
                      <span className="text-[9px] sm:text-xs font-black tracking-tight drop-shadow-xs truncate">
                        {formatCurrency(
                          node.totalValue,
                          settings.currencyUnit,
                          true,
                          settings.usePersianDigits,
                          settings.privacyMode,
                          lang
                        )}
                      </span>
                      <span className="text-[9px] sm:text-[10px] opacity-90 font-medium truncate">
                        {formatPercentage(
                          node.percentOfTotal,
                          settings.decimalPlaces,
                          settings.usePersianDigits,
                          lang
                        )}{' '}
                        {isEn ? 'of total' : 'از کل'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 px-2">
        <span>
          {isEn
            ? 'Rectangle area represents asset value proportion relative to branch'
            : 'مساحت هر مستطیل بر اساس نسبت ارزش دارایی به کل شاخه محاسبه شده است'}
        </span>
        <button
          type="button"
          onClick={() => onSelectNodeDetails(currentNode)}
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{isEn ? 'View Current Group Profile' : 'مشاهده مشخصات گروه جاری'}</span>
        </button>
      </div>
    </div>
  );
};
