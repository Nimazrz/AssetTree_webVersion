import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import { formatCurrency, formatPercentage } from '../utils/numberFormat';
import { ZoomOut, Eye, FolderTree } from 'lucide-react';

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
  sweep: number;
  innerRadius: number;
  outerRadius: number;
  midAngle: number;
  midRadius: number;
  labelX: number;
  labelY: number;
  color: string;
}

export const SunburstChartView: React.FC<SunburstProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
}) => {
  const [activeRoot, setActiveRoot] = useState<CalculatedNode>(rootCalculated);
  const [hoveredNode, setHoveredNode] = useState<CalculatedNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CalculatedNode | null>(null);
  const lastClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const legendItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // Legend categories: children of current root sorted descending by totalValue
  const legendItems = useMemo(() => {
    return [...currentRoot.children]
      .filter((c) => c.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [currentRoot]);

  // Auto-scroll legend item into view when hovered or selected from the chart
  const activeNodeForLegend = hoveredNode || selectedNode;
  useEffect(() => {
    if (activeNodeForLegend) {
      // Find matching top-level category or exact node
      const targetId = activeNodeForLegend.id;
      const element = legendItemRefs.current.get(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeNodeForLegend]);

  const slices = useMemo(() => {
    const list: RadialSlice[] = [];
    const rootTotal = currentRoot.totalValue;
    if (rootTotal <= 0) return list;

    // Radius configurations
    const r0 = 65; // Inner center circle
    const r1 = 140; // Ring 1
    const r2 = 215; // Ring 2

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
      const midAngle = (startAngle + endAngle) / 2;
      const midRadius1 = (r0 + 4 + r1) / 2;

      list.push({
        node: child,
        level: 1,
        startAngle,
        endAngle,
        sweep,
        innerRadius: r0 + 4,
        outerRadius: r1,
        midAngle,
        midRadius: midRadius1,
        labelX: midRadius1 * Math.cos(midAngle),
        labelY: midRadius1 * Math.sin(midAngle),
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

          const gMidAngle = (gStart + gEnd) / 2;
          const midRadius2 = (r1 + 3 + r2) / 2;

          list.push({
            node: grandChild,
            level: 2,
            startAngle: gStart,
            endAngle: gEnd,
            sweep: grandSweep,
            innerRadius: r1 + 3,
            outerRadius: r2,
            midAngle: gMidAngle,
            midRadius: midRadius2,
            labelX: midRadius2 * Math.cos(gMidAngle),
            labelY: midRadius2 * Math.sin(gMidAngle),
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

  const handleZoomIntoGroup = (node: CalculatedNode) => {
    if (node.isGroup && node.children.length > 0) {
      setActiveRoot(node);
      setSelectedNode(null);
    }
  };

  // Vazife 8: 1 click/tap expands/zooms branch (or selects), 2 clicks/taps shows properties & add child menu
  const handleNodeClick = (node: CalculatedNode) => {
    const now = Date.now();
    if (lastClickRef.current.id === node.id && now - lastClickRef.current.time < 380) {
      // 2 clicks/taps: open properties and add child modal
      onSelectNodeDetails(node);
      lastClickRef.current = { id: '', time: 0 };
      return;
    }

    lastClickRef.current = { id: node.id, time: now };

    // 1 click/tap: if branch with children -> zoom/open branch
    if (node.isGroup && node.children.length > 0) {
      handleZoomIntoGroup(node);
    } else {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node));
    }
  };

  const activeNode = hoveredNode || selectedNode || currentRoot;

  return (
    <div className="w-full pb-16 flex flex-col items-center">
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
        {/* Header navigation if drilled down */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isEn ? 'Sunburst Hierarchical View' : 'نمودار خورشیدی ساختار دارایی‌ها'}
            </h2>
            {activeRoot.id !== rootCalculated.id && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                ({activeRoot.name})
              </span>
            )}
          </div>

          {activeRoot.id !== rootCalculated.id && (
            <button
              type="button"
              onClick={() => {
                setActiveRoot(rootCalculated);
                setSelectedNode(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>{isEn ? 'Zoom to Root' : 'بازگشت به ریشه پورتفو'}</span>
            </button>
          )}
        </div>

        {/* Main Content Area: Chart + Side Legend (Vazife 1) */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8">
          {/* SVG Sunburst */}
          <div className="relative w-full aspect-square max-w-[340px] xs:max-w-[400px] sm:max-w-[460px] flex items-center justify-center shrink-0">
            <svg viewBox="-230 -230 460 460" className="w-full h-full transform -rotate-90 select-none">
              <g>
                {slices.map((slice) => {
                  const isHovered = hoveredNode?.id === slice.node.id;
                  const isSelected = selectedNode?.id === slice.node.id;

                  return (
                    <path
                      key={`slice-${slice.node.id}-${slice.level}`}
                      d={getArcD(
                        slice.innerRadius,
                        isSelected || isHovered ? slice.outerRadius + 4 : slice.outerRadius,
                        slice.startAngle,
                        slice.endAngle
                      )}
                      fill={slice.color}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        opacity: (hoveredNode || selectedNode) && !isHovered && !isSelected ? 0.5 : 1,
                        filter: isSelected ? 'drop-shadow(0px 2px 6px rgba(0,0,0,0.35))' : undefined,
                      }}
                      onMouseEnter={() => setHoveredNode(slice.node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => handleNodeClick(slice.node)}
                      onDoubleClick={() => onSelectNodeDetails(slice.node)}
                    />
                  );
                })}

                {/* Text labels on sunburst arcs */}
                {slices.map((slice) => {
                  if (slice.sweep < 0.18) return null;
                  const displayName = slice.node.symbol || slice.node.name;
                  const percentStr = `${Math.round(slice.node.percentOfTotal)}٪`;
                  const label = `${displayName} (${percentStr})`;

                  return (
                    <g
                      key={`sunburst-lbl-${slice.node.id}-${slice.level}`}
                      transform={`translate(${slice.labelX}, ${slice.labelY}) rotate(90)`}
                      className="pointer-events-none select-none"
                    >
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-bold text-[9px] sm:text-[10px]"
                        style={{
                          paintOrder: 'stroke',
                          stroke: 'rgba(15, 23, 42, 0.85)',
                          strokeWidth: '2px',
                          strokeLinejoin: 'round',
                        }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Center Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="64"
                  className="fill-white dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-750 transition-colors"
                  strokeWidth="2"
                />
              </g>
            </svg>

            {/* Center Text Information */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 max-w-[130px] mx-auto">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate w-full">
                {activeNode.name}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate w-full">
                {formatCurrency(
                  activeNode.totalValue,
                  settings.currencyUnit,
                  true,
                  settings.usePersianDigits,
                  settings.privacyMode,
                  lang
                )}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {formatPercentage(activeNode.percentOfTotal, 1, settings.usePersianDigits, lang)}
              </span>
            </div>
          </div>

          {/* Vazife 1: Sunburst Legend on the left/side, sorted descending by total value */}
          <div className="flex-1 w-full flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-blue-500" />
                <span>{isEn ? 'Asset Hierarchy Legend (Descending)' : 'راهنمای ساختار دارایی‌ها (ترتیب نزولی)'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {isEn ? '1 tap: open branch / 2 taps: details' : '۱ کلیک: باز شدن شاخه / ۲ کلیک: مشخصات'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {legendItems.map((item) => {
                const palette = getPaletteForNode(item.name, item.categoryTag, settings.customAssetColors);
                const isHovered = hoveredNode?.id === item.id;
                const isSelected = selectedNode?.id === item.id;

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) legendItemRefs.current.set(item.id, el);
                      else legendItemRefs.current.delete(item.id);
                    }}
                    onClick={() => handleNodeClick(item)}
                    onDoubleClick={() => onSelectNodeDetails(item)}
                    onMouseEnter={() => setHoveredNode(item)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs ring-1 ring-blue-400'
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
                        {item.name} {item.symbol ? `[${item.symbol}]` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono">
                        {formatCurrency(
                          item.totalValue,
                          settings.currencyUnit,
                          true,
                          settings.usePersianDigits,
                          settings.privacyMode,
                          lang
                        )}
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 min-w-8 sm:min-w-9 text-left font-mono">
                        {formatPercentage(item.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Details Action Bar */}
            {selectedNode && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 animate-in fade-in duration-150 mt-1">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                    {selectedNode.name} {selectedNode.symbol ? `[${selectedNode.symbol}]` : ''}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {formatCurrency(selectedNode.totalValue, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}{' '}
                    ({formatPercentage(selectedNode.percentOfTotal, 1, settings.usePersianDigits, lang)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedNode.isGroup && selectedNode.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleZoomIntoGroup(selectedNode)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isEn ? 'Zoom In' : 'ورود به شاخه'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectNodeDetails(selectedNode)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Details' : 'مشخصات و افزودن زیرشاخه'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
