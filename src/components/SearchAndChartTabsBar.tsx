import React, { useState } from 'react';
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
  ChevronsDown,
  ChevronsUp,
  GripVertical,
  Move,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowLeftRight,
  Check,
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
  onUpdateSettings?: (settings: DisplaySettings) => void;
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
  onUpdateSettings,
  sortConfig,
  onUpdateSort,
  onExpandAll,
  onCollapseAll,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';

  const [draggedMode, setDraggedMode] = useState<AppViewMode | null>(null);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  // Position of the View Mode menu (TOP inline or BOTTOM_FLOAT dock)
  const menuPosition = settings.viewMenuPosition || 'TOP';

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
    { field: 'PERCENT_OF_GROUP', label: isEn ? '% of Peer Group' : 'درصد از هم‌گروه' },
  ];

  // Tab drag-and-drop reorder handlers
  const handleDragStart = (e: React.DragEvent, mode: AppViewMode) => {
    setDraggedMode(mode);
    e.dataTransfer.setData('text/plain', mode);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetMode: AppViewMode) => {
    e.preventDefault();
    if (!draggedMode || draggedMode === targetMode) return;

    const currentModes = orderedTabs.map((t) => t.mode);
    const fromIndex = currentModes.indexOf(draggedMode);
    const toIndex = currentModes.indexOf(targetMode);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updated = [...currentModes];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);

      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          customViewOrder: updated,
        });
      }
    }
    setDraggedMode(null);
  };

  // Move tab left/right manually
  const moveTab = (mode: AppViewMode, direction: 'LEFT' | 'RIGHT') => {
    const currentModes = orderedTabs.map((t) => t.mode);
    const idx = currentModes.indexOf(mode);
    if (idx === -1) return;

    const targetIdx = direction === 'LEFT' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentModes.length) return;

    const updated = [...currentModes];
    const [removed] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, removed);

    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        customViewOrder: updated,
      });
    }
  };

  // Toggle dock position (Top vs Floating Bottom)
  const toggleMenuPosition = () => {
    const nextPos = menuPosition === 'TOP' ? 'BOTTOM_FLOAT' : 'TOP';
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        viewMenuPosition: nextPos,
      });
    }
  };

  // Render the Tabs Menu component with left-positioned icon-only reorder button
  const renderTabsList = () => (
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
      <div
        className={`flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth select-none flex-1 ${
          menuPosition === 'BOTTOM_FLOAT' ? 'px-2' : ''
        }`}
        aria-label="Chart and Tree View Modes"
      >
        {orderedTabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.mode;
          const label = TRANSLATIONS.tabs[tab.mode]?.[lang] || tab.mode;

          return (
            <div
              key={tab.mode}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, tab.mode)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.mode)}
              className="flex items-center group/tab relative shrink-0"
            >
              <button
                type="button"
                id={`btn-chart-type-${tab.mode.toLowerCase()}`}
                onClick={() => onSelectView(tab.mode)}
                title={
                  isEn
                    ? `Click to view, or drag to reorder ${label}`
                    : `کلیک برای نمایش یا درگ برای جابجایی ترتیب: ${label}`
                }
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer min-h-[36px] sm:min-h-[40px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-500'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                } ${draggedMode === tab.mode ? 'opacity-40 border-2 border-dashed border-blue-400' : ''}`}
              >
                <GripVertical className="w-3 h-3 text-slate-400 dark:text-slate-500 opacity-40 group-hover/tab:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0" />
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{label}</span>
              </button>

              {/* Quick arrows in reorder mode */}
              {isReorderMode && (
                <div className="flex items-center gap-0.5 ml-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveTab(tab.mode, 'LEFT')}
                      title={isEn ? 'Move earlier' : 'انتقال به قبل'}
                      className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {index < orderedTabs.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveTab(tab.mode, 'RIGHT')}
                      title={isEn ? 'Move later' : 'انتقال به بعد'}
                      className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vazife 7: Reorder button on the left side of charts row, icon-only with left-right arrows and checkmark for confirmation */}
      <button
        type="button"
        id="btn-toggle-reorder-tabs"
        onClick={() => setIsReorderMode(!isReorderMode)}
        title={
          isReorderMode
            ? (isEn ? 'Confirm Tab Order' : 'تأیید ترتیب نمودارها')
            : (isEn ? 'Reorder Tabs' : 'جابجایی ترتیب نمودارها')
        }
        className={`p-2 sm:p-2.5 rounded-xl shrink-0 transition-all cursor-pointer border flex items-center justify-center ${
          isReorderMode
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/30'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
        }`}
      >
        {isReorderMode ? (
          <Check className="w-4 h-4 text-white" />
        ) : (
          <ArrowLeftRight className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <>
      <section
        id="search-and-chart-controls-panel"
        aria-label={isEn ? 'Search and View Selection' : 'جستجو و انتخاب نوع نمودار'}
        className="w-full mb-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs transition-colors"
      >
        {/* 1) TOP TIER: SEARCH BOX & 2 PROMINENT EXPAND/COLLAPSE SYMBOLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
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

          {/* Vazife 6: 2 DISTINCT SYMBOLS TO EXPAND AND COLLAPSE ALL BRANCHES WITHOUT TEXT */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              {/* Symbol 1: Expand All (علامت باز کردن کل شاخه‌ها - فقط آیکون دوبل) */}
              <button
                type="button"
                id="btn-expand-all-nodes"
                onClick={onExpandAll}
                title={isEn ? 'Expand All Branches' : 'باز کردن کل شاخه‌ها'}
                className="p-2 sm:p-2.5 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
              >
                <ChevronsDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>

              {/* Symbol 2: Collapse All (علامت بستن کل شاخه‌ها - فقط آیکون دوبل) */}
              <button
                type="button"
                id="btn-collapse-all-nodes"
                onClick={onCollapseAll}
                title={isEn ? 'Collapse All Branches' : 'بستن کل شاخه‌ها'}
                className="p-2 sm:p-2.5 rounded-xl text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
              >
                <ChevronsUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
              </button>
            </div>

            {/* Tree Sorting Selector */}
            {isTreeMode && sortConfig && onUpdateSort && (
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
                  className="text-[11px] sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
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
        </div>

        {/* 2) VIEW MODE MENU (Vazife 7: Entire caption row removed, tabs list with left reorder button) */}
        {menuPosition === 'TOP' && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            {renderTabsList()}
          </div>
        )}
      </section>

      {/* 3) FLOATING DOCK AT BOTTOM WHEN POSITION IS BOTTOM_FLOAT */}
      {menuPosition === 'BOTTOM_FLOAT' && (
        <aside
          aria-label="Floating View Mode Navigation"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-1.5 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-1 px-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
            <span className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              {isEn ? 'Movable View Menu' : 'منوی متحرک نوع نمایش'}
            </span>
            <button
              type="button"
              onClick={toggleMenuPosition}
              className="hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
            >
              {isEn ? 'Dock to Top' : 'بازگشت به موقعیت بالا'}
            </button>
          </div>
          {renderTabsList()}
        </aside>
      )}
    </>
  );
};
