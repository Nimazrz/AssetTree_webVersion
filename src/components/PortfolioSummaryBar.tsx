import React, { useMemo, useState } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import { TrendingUp, Coins, Play, Pause, Sparkles } from 'lucide-react';

interface PortfolioSummaryBarProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
}

export const PortfolioSummaryBar: React.FC<PortfolioSummaryBarProps> = ({
  rootCalculated,
  settings,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const [isPaused, setIsPaused] = useState(false);

  // Collect all nodes for Row 1: sorted descending by totalValue
  // "سطر اول: ارزش کل + نماد + درصد از کل دارایی بصورت نزولی مرتب شود"
  const row1Nodes = useMemo(() => {
    const list: CalculatedNode[] = [];
    const collect = (node: CalculatedNode) => {
      if (node.id !== rootCalculated.id && node.totalValue > 0) {
        list.push(node);
      }
      node.children.forEach(collect);
    };
    collect(rootCalculated);
    return list.sort((a, b) => b.totalValue - a.totalValue);
  }, [rootCalculated]);

  // Collect leaf nodes for Row 2: "قیمت واحد دارایی های برگ بصورت نام دارایی[نماد]:قیمت واحد دارایی"
  const row2LeafNodes = useMemo(() => {
    const leaves: CalculatedNode[] = [];
    const collectLeaves = (node: CalculatedNode) => {
      if (!node.isGroup && node.id !== rootCalculated.id) {
        leaves.push(node);
      }
      node.children.forEach(collectLeaves);
    };
    collectLeaves(rootCalculated);
    return leaves.sort((a, b) => b.totalValue - a.totalValue);
  }, [rootCalculated]);

  if (row1Nodes.length === 0) {
    return null;
  }

  // Duplicate items for infinite seamless looping
  const row1ItemsDoubled = [...row1Nodes, ...row1Nodes];
  const row2ItemsDoubled = [...row2LeafNodes, ...row2LeafNodes];

  return (
    <div
      id="portfolio-summary-bar"
      className="w-full mb-3 sm:mb-4 bg-slate-900/50 backdrop-blur-md text-slate-100 rounded-2xl border border-slate-800/80 shadow-md overflow-hidden"
    >
      {/* Row 1: ارزش و سهم دارایی‌ها بصورت نزولی */}
      <div className="relative py-2.5 px-3 overflow-hidden border-b border-slate-800/60 bg-transparent">
        <div className="flex items-center">
          {/* Row 1 Label Badge (Click to Pause/Resume with flat background matching ticker) */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? (isEn ? 'Resume' : 'ادامه حرکت نوار') : (isEn ? 'Pause' : 'توقف نوار')}
            className="z-10 shrink-0 px-2.5 py-1 ml-3 mr-1 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 text-blue-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-slate-700 select-none"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>{isEn ? 'Top Assets' : 'ارزش و سهم دارایی‌ها'}</span>
            <span className="p-0.5 rounded-sm bg-slate-800/80 text-slate-400 mr-0.5">
              {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
            </span>
          </button>

          {/* Marquee Scroller */}
          <div className="overflow-hidden flex-1 relative">
            <div
              className={`animate-ticker flex items-center gap-5 ${
                isPaused ? 'ticker-paused' : ''
              }`}
            >
              {row1ItemsDoubled.map((node, idx) => {
                const displayName = node.symbol ? `${node.symbol} (${node.name})` : node.name;
                const formattedVal = formatCurrency(
                  node.totalValue,
                  settings.currencyUnit,
                  true,
                  settings.usePersianDigits,
                  false,
                  lang
                );
                const percent = formatNumberWithCommas(
                  node.percentOfTotal,
                  settings.usePersianDigits,
                  1,
                  lang
                );

                return (
                  <div
                    key={`r1-${node.id}-${idx}`}
                    className="shrink-0 flex items-center gap-2 py-0.5 text-slate-200"
                  >
                    {/* Symbol / Name */}
                    <span className="font-semibold text-xs sm:text-sm text-slate-200 max-w-[170px] truncate">
                      {displayName}
                    </span>

                    <span className="text-slate-500 font-light">:</span>

                    {/* Total Value (Enlarged number - Vazife 3) */}
                    <span className="text-base sm:text-xl font-black text-amber-300 font-mono tracking-tight">
                      {formattedVal}
                    </span>

                    {/* Percent of Total (Enlarged number - Vazife 3) */}
                    <span className="text-sm sm:text-lg font-bold text-blue-400 font-mono">
                      ({percent}٪)
                    </span>

                    {/* Subtle divider */}
                    <span className="text-slate-600 font-light mr-1">✦</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: نرخ واحد برگه‌ها */}
      <div className="relative py-2 px-3 overflow-hidden bg-transparent">
        <div className="flex items-center">
          {/* Row 2 Label Badge (Click to Pause/Resume with flat background matching ticker) */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? (isEn ? 'Resume' : 'ادامه حرکت نوار') : (isEn ? 'Pause' : 'توقف نوار')}
            className="z-10 shrink-0 px-2.5 py-1 ml-3 mr-1 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-slate-700 select-none"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEn ? 'Unit Prices' : 'نرخ واحد برگه‌ها'}</span>
            <span className="p-0.5 rounded-sm bg-slate-800/80 text-slate-400 mr-0.5">
              {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
            </span>
          </button>

          {/* Marquee Scroller */}
          <div className="overflow-hidden flex-1 relative">
            <div
              className={`animate-ticker-fast flex items-center gap-5 ${
                isPaused ? 'ticker-paused' : ''
              }`}
            >
              {row2ItemsDoubled.map((node, idx) => {
                const label = node.symbol
                  ? `${node.name} [${node.symbol}]`
                  : node.name;
                const formattedUnitPrice = formatCurrency(
                  node.unitPrice,
                  settings.currencyUnit,
                  false,
                  settings.usePersianDigits,
                  false,
                  lang
                );

                return (
                  <div
                    key={`r2-${node.id}-${idx}`}
                    className="shrink-0 flex items-center gap-2 py-0.5 text-slate-300"
                  >
                    <span className="font-medium text-xs sm:text-sm text-slate-300">
                      {label}:
                    </span>
                    {/* Unit Price (Enlarged number - Vazife 3) */}
                    <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono tracking-tight">
                      {formattedUnitPrice}
                    </span>
                    {node.unit && (
                      <span className="text-xs sm:text-sm text-slate-400">
                        / {node.unit}
                      </span>
                    )}

                    {/* Subtle divider */}
                    <span className="text-slate-600 font-light mr-1">✦</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
