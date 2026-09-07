import React from 'react';
import {
  AppViewMode,
  DisplaySettings,
  AppLanguage,
  SortConfig,
  SortField,
} from '../types';
import {
  Grid,
  ListTree,
  FolderTree,
  Compass,
  BarChart2,
  PieChart,
  LineChart,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export const CHART_VIEW_TABS: {
  mode: AppViewMode;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { mode: 'TREEMAP', icon: Grid },
  { mode: 'CLASSIC_TREE', icon: ListTree },
  { mode: 'TREE', icon: FolderTree },
  { mode: 'CHART', icon: Compass },
  { mode: 'BAR_CHART', icon: BarChart2 },
  { mode: 'PIE_CHART', icon: PieChart },
  { mode: 'ANALYTICS', icon: LineChart },
];

interface SearchAndChartTabsBarProps {
  activeView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: DisplaySettings;
  sortConfig?: SortConfig;
  onUpdateSort?: (sort: SortConfig) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export const SearchAndChartTabsBar: React.FC<SearchAndChartTabsBarProps> = ({
  activeView,
  onSelectView,
  searchQuery,
  onSearchChange,
  settings,
  sortConfig,
  onUpdateSort,
  onExpandAll,
  onCollapseAll,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';

  // Sort tabs according to customViewOrder if configured
  const orderedTabs = React.useMemo(() => {
    if (!settings.customViewOrder || settings.customViewOrder.length === 0) {
      return CHART_VIEW_TABS;
    }
    const map = new Map(CHART_VIEW_TABS.map((t) => [t.mode, t]));
    const result: typeof CHART_VIEW_TABS = [];
    for (const mode of settings.customViewOrder) {
      const tab = map.get(mode);
      if (tab) {
        result.push(tab);
        map.delete(mode);
      }
    }
    for (const tab of map.values()) {
      result.push(tab);
    }
    return result;
  }, [settings.customViewOrder]);

  const isTreeMode = activeView === 'TREE' || activeView === 'CLASSIC_TREE';

  const sortFields: { field: SortField; label: string }[] = [
    { field: 'TOTAL_VALUE', label: isEn ? 'Total Value' : 'ارزش کل' },
    { field: 'NAME', label: isEn ? 'Asset Name' : 'نام دارایی' },
    { field: 'QUANTITY', label: isEn ? 'Quantity' : 'تعداد/مقدار' },
    { field: 'UNIT_PRICE', label: isEn ? 'Unit Price' : 'قیمت واحد' },
    { field: 'PERCENT_OF_TOTAL', label: isEn ? '% of Total' : 'درصد از کل' },
    { field: 'PERCENT_OF_GROUP', label: isEn ? '% of Group' : 'درصد از گروه' },
  ];

  return (
    <section
      id="search-and-chart-controls-panel"
      aria-label={isEn ? 'Search and View Selection' : 'جستجو و انتخاب نوع نمودار'}
      className="w-full mb-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs transition-colors"
    >
      {/* 1) TOP TIER: SEARCH BOX & QUICK TREE CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-0">
          <Search
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
              isRtl ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            id="input-portfolio-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isEn
                ? 'Quick search assets, symbols, groups or categories...'
                : 'جستجوی سریع دارایی، نماد، گروه یا دسته‌بندی...'
            }
            className={`w-full py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 focus:outline-hidden focus:ring-2 focus:ring-blue-500/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all ${
              isRtl ? 'pr-9 pl-8 sm:pr-10 sm:pl-9' : 'pl-9 pr-8 sm:pl-10 sm:pr-9'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              id="btn-clear-search"
              onClick={() => onSearchChange('')}
              title={isEn ? 'Clear search' : 'پاک کردن جستجو'}
              className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                isRtl ? 'left-2' : 'right-2'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tree controls (Expand / Collapse / Sort) when in Tree view modes */}
        {isTreeMode && (
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 shrink-0">
            <div className="flex items-center gap-1">
              {onExpandAll && (
                <button
                  type="button"
                  id="btn-expand-all-nodes"
                  onClick={onExpandAll}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60 sm:border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {isEn ? 'Expand All' : 'گسترش همه'}
                </button>
              )}
              {onCollapseAll && (
                <button
                  type="button"
                  id="btn-collapse-all-nodes"
                  onClick={onCollapseAll}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60 sm:border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {isEn ? 'Collapse All' : 'جمع‌کردن همه'}
                </button>
              )}
            </div>

            {sortConfig && onUpdateSort && (
              <div
                className={`flex items-center gap-1 ${
                  isRtl ? 'sm:border-r sm:pr-2' : 'sm:border-l sm:pl-2'
                } border-slate-200 dark:border-slate-800`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  id="select-tree-sorting"
                  value={sortConfig.field}
                  onChange={(e) =>
                    onUpdateSort({
                      ...sortConfig,
                      field: e.target.value as SortField,
                    })
                  }
                  className="text-[11px] sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  {sortFields.map((f) => (
                    <option key={f.field} value={f.field}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2) BOTTOM TIER: CHART TYPE SELECTION MENU (منوی انتخاب نوع نمودار در زیر باکس جستجو) */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth" aria-label="Chart Type Selection">
          {orderedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.mode;
            const label = TRANSLATIONS.tabs[tab.mode]?.[lang] || tab.mode;

            return (
              <button
                key={tab.mode}
                type="button"
                id={`btn-chart-type-${tab.mode.toLowerCase()}`}
                onClick={() => onSelectView(tab.mode)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer min-h-[36px] sm:min-h-[40px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-500'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
