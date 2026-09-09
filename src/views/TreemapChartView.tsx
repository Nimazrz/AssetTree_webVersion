import React, { useState, useMemo, useRef } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import { formatCurrency, formatPercentage } from '../utils/numberFormat';
import { ChevronRight, ChevronLeft, Home, Layers, Grid, Eye, ArrowUpRight } from 'lucide-react';

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
  // Mode: 'all_leaves' (Full tree map - 100% visible) or 'hierarchical'
  const [viewMode, setViewMode] = useState<'all_leaves' | 'hierarchical'>('all_leaves');
  const [drilldownPath, setDrilldownPath] = useState<CalculatedNode[]>([rootCalculated]);
  const [hoveredNode, setHoveredNode] = useState<CalculatedNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CalculatedNode | null>(null);
  const lastClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';

  const currentNode = drilldownPath[drilldownPath.length - 1] || rootCalculated;

  // Flatten leaf assets for "نقشه دارایی کامل پیدا باشد"
  const allLeafAssets = useMemo(() => {
    const list: CalculatedNode[] = [];
    const collect = (n: CalculatedNode) => {
      if (!n.isGroup && n.id !== rootCalculated.id && n.totalValue > 0) {
        list.push(n);
      }
      n.children.forEach(collect);
    };
    collect(rootCalculated);
    return list.sort((a, b) => b.totalValue - a.totalValue);
  }, [rootCalculated]);

  // Items to layout based on viewMode
  const activeItems = useMemo(() => {
    if (viewMode === 'all_leaves') {
      return allLeafAssets;
    }
    return currentNode.children.filter((c) => c.totalValue > 0);
  }, [viewMode, allLeafAssets, currentNode]);

  // Squarified Layout
  const tiles: TreemapRect[] = useMemo(() => {
    if (activeItems.length === 0) return [];
    const totalVal = activeItems.reduce((s, it) => s + it.totalValue, 0);
    if (totalVal <= 0) return [];

    const sorted = [...activeItems].sort((a, b) => b.totalValue - a.totalValue);

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
        const w1 = w * ratio;
        const w2 = w - w1;
        return [
          ...layoutRectangles(g1, x, y, w1, h),
          ...layoutRectangles(g2, x + w1, y, w2, h),
        ];
      } else {
        const h1 = h * ratio;
        const h2 = h - h1;
        return [
          ...layoutRectangles(g1, x, y, w, h1),
          ...layoutRectangles(g2, x, y + h1, w, h2),
        ];
      }
    };

    return layoutRectangles(sorted, 0, 0, 100, 100);
  }, [activeItems]);

  // Vazife 8: 1 click/tap drills into branch (if group) or selects, 2 clicks/taps opens properties and details menu
  const handleTileClick = (node: CalculatedNode) => {
    const now = Date.now();
    if (lastClickRef.current.id === node.id && now - lastClickRef.current.time < 380) {
      onSelectNodeDetails(node);
      lastClickRef.current = { id: '', time: 0 };
      return;
    }

    lastClickRef.current = { id: node.id, time: now };
    if (node.isGroup && node.children.length > 0) {
      handleDrillIntoGroup(node);
    } else {
      if (selectedNode?.id === node.id) {
        setSelectedNode(null);
      } else {
        setSelectedNode(node);
      }
    }
  };

  const handleDrillIntoGroup = (node: CalculatedNode) => {
    if (node.isGroup && node.children.length > 0) {
      setViewMode('hierarchical');
      setDrilldownPath((prev) => [...prev, node]);
      setSelectedNode(null);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setDrilldownPath((prev) => prev.slice(0, index + 1));
    setSelectedNode(null);
  };

  return (
    <div className="w-full pb-16 flex flex-col">
      {/* View Mode Switch & Navigation */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Toggle Mode: Full Leaf Map vs Group Drilldown */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('all_leaves')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'all_leaves'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isEn ? 'Full Asset Map (All Items)' : 'نقشه کامل تمام دارایی‌ها'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('hierarchical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'hierarchical'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isEn ? 'By Categories' : 'دسته‌بندی‌های کلان'}</span>
          </button>
        </div>

        {/* Breadcrumb if hierarchical */}
        {viewMode === 'hierarchical' && (
          <div className="flex items-center gap-1 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setDrilldownPath([rootCalculated])}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isEn ? 'Root' : 'ریشه'}</span>
            </button>

            {drilldownPath.slice(1).map((node, i) => (
              <React.Fragment key={node.id}>
                {isRtl ? (
                  <ChevronLeft className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
                <button
                  type="button"
                  onClick={() => handleBreadcrumbClick(i + 1)}
                  className="px-1.5 py-0.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {node.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Main Treemap Canvas */}
      <div className="w-full h-[520px] bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 p-2 relative overflow-hidden shadow-inner select-none">
        {tiles.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            {isEn ? 'No asset values to display' : 'دارایی دارای ارزش جهت نمایش وجود ندارد'}
          </div>
        ) : (
          tiles.map((tile) => {
            const isHovered = hoveredNode?.id === tile.node.id;
            const isSelected = selectedNode?.id === tile.node.id;
            const palette = getPaletteForNode(tile.node.name, tile.node.categoryTag, settings.customAssetColors);

            // Responsive label visibility
            const isTiny = tile.width < 9 || tile.height < 9;
            const isCompact = tile.width < 16 || tile.height < 15;

            return (
              <div
                key={tile.node.id}
                style={{
                  position: 'absolute',
                  left: `${tile.x}%`,
                  top: `${tile.y}%`,
                  width: `${tile.width}%`,
                  height: `${tile.height}%`,
                  padding: '2px',
                }}
                className="transition-all duration-150"
              >
                <div
                  onClick={() => handleTileClick(tile.node)}
                  onDoubleClick={() => onSelectNodeDetails(tile.node)}
                  onMouseEnter={() => setHoveredNode(tile.node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    backgroundColor: palette.primary,
                  }}
                  className={`w-full h-full rounded-xl p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all border ${
                    isSelected
                      ? 'ring-3 ring-white border-white scale-[0.99] z-20 shadow-lg'
                      : isHovered
                      ? 'brightness-110 border-white/60 scale-[0.99] z-10'
                      : 'border-black/20 hover:brightness-105'
                  }`}
                >
                  {/* Tile Top Label: Name + Symbol */}
                  {!isTiny && (
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-white font-bold text-xs sm:text-sm drop-shadow-sm truncate">
                          {tile.node.name}
                        </span>
                        {tile.node.symbol && !isCompact && (
                          <span className="text-[10px] px-1 py-0.2 rounded-sm bg-black/25 text-white/90 font-mono font-semibold shrink-0">
                            {tile.node.symbol}
                          </span>
                        )}
                      </div>

                      {tile.node.assetType && !isCompact && (
                        <span className="text-[10px] text-white/80 font-medium truncate">
                          {tile.node.assetType}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tile Bottom Label: Value + Percent */}
                  {!isTiny && (
                    <div className="flex items-baseline justify-between gap-1 text-white drop-shadow-sm min-w-0">
                      {!isCompact && (
                        <span className="text-[11px] font-mono font-bold truncate">
                          {formatCurrency(
                            tile.node.totalValue,
                            settings.currencyUnit,
                            true,
                            settings.usePersianDigits,
                            settings.privacyMode,
                            lang
                          )}
                        </span>
                      )}
                      <span className="text-[10px] sm:text-xs font-mono font-black ml-auto bg-black/30 px-1.5 py-0.5 rounded-md">
                        {formatPercentage(tile.node.percentOfTotal, 1, settings.usePersianDigits, lang)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tile Inspection Drawer (User requirement: "با یک ضربه نمودارها باز نشود") */}
      {selectedNode && (
        <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="min-w-0 text-center sm:text-right">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedNode.name}
              </span>
              {selectedNode.symbol && (
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
                  {selectedNode.symbol}
                </span>
              )}
              {selectedNode.assetType && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                  {selectedNode.assetType}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn ? 'Value: ' : 'ارزش کل: '}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(selectedNode.totalValue, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}
              </span>{' '}
              • {isEn ? 'Share: ' : 'سهم از سبد: '}{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatPercentage(selectedNode.percentOfTotal, 2, settings.usePersianDigits, lang)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedNode.isGroup && selectedNode.children.length > 0 && (
              <button
                type="button"
                onClick={() => handleDrillIntoGroup(selectedNode)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isEn ? 'Enter Group' : 'ورود به این زیرمجموعه'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectNodeDetails(selectedNode)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isEn ? 'View Details' : 'مشاهده شناسنامه کامل دارایی'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
