import React from 'react';
import {
  AppViewMode,
  DisplaySettings,
  AppLanguage,
} from '../types';
import {
  Grid,
  ListTree,
  FolderTree,
  Sun,
  Moon,
  Eye,
  EyeOff,
  RotateCcw,
  FileSpreadsheet,
  BookOpen,
  Settings,
  PieChart,
  BarChart2,
  LineChart,
  Compass,
  Languages,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

interface AppTopBarProps {
  activeView: AppViewMode;
  settings: DisplaySettings;
  undoCount: number;
  isDark: boolean;
  onSelectView: (view: AppViewMode) => void;
  onToggleTheme: () => void;
  onTogglePrivacy: () => void;
  onToggleLanguage: () => void;
  onUndo: () => void;
  onOpenExcelImport: () => void;
  onOpenSymbolBook: () => void;
  onOpenSettings: () => void;
}

export const VIEW_TABS: { mode: AppViewMode; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'TREEMAP', icon: Grid },
  { mode: 'CLASSIC_TREE', icon: ListTree },
  { mode: 'TREE', icon: FolderTree },
  { mode: 'CHART', icon: Compass },
  { mode: 'BAR_CHART', icon: BarChart2 },
  { mode: 'PIE_CHART', icon: PieChart },
  { mode: 'ANALYTICS', icon: LineChart },
];

export const AppTopBar: React.FC<AppTopBarProps> = ({
  activeView,
  settings,
  undoCount,
  isDark,
  onSelectView,
  onToggleTheme,
  onTogglePrivacy,
  onToggleLanguage,
  onUndo,
  onOpenExcelImport,
  onOpenSymbolBook,
  onOpenSettings,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const tTop = TRANSLATIONS.topBar;

  // Sort tabs according to customViewOrder
  const orderedTabs = React.useMemo(() => {
    if (!settings.customViewOrder || settings.customViewOrder.length === 0) {
      return VIEW_TABS;
    }
    const map = new Map(VIEW_TABS.map((t) => [t.mode, t]));
    const result: typeof VIEW_TABS = [];
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

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Top row: Brand & Action Icons */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {TRANSLATIONS.appTitle[lang]}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {TRANSLATIONS.appSubtitle[lang]}
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Quick Language Toggle Button */}
            <button
              type="button"
              id="btn-quick-lang-toggle"
              onClick={onToggleLanguage}
              title={isEn ? tTop.switchLanguageToFa[lang] : tTop.switchLanguageToEn[lang]}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors text-xs font-bold cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isEn ? 'فارسی' : 'EN'}</span>
            </button>

            {/* Privacy Mode Toggle */}
            <button
              type="button"
              id="btn-privacy-toggle"
              onClick={onTogglePrivacy}
              title={settings.privacyMode ? tTop.privacyOn[lang] : tTop.privacyOff[lang]}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                settings.privacyMode
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400/40'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {settings.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Undo Button with Counter */}
            <button
              type="button"
              id="btn-undo-history"
              onClick={onUndo}
              disabled={undoCount === 0}
              title={tTop.undo[lang]}
              className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                undoCount > 0
                  ? 'text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              {undoCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {undoCount}
                </span>
              )}
            </button>

            {/* Excel Import */}
            <button
              type="button"
              id="btn-excel-import"
              onClick={onOpenExcelImport}
              title={tTop.excelImport[lang]}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{isEn ? 'Excel Import' : 'ورود از اکسل'}</span>
            </button>

            {/* Symbol Book */}
            <button
              type="button"
              id="btn-symbol-book"
              onClick={onOpenSymbolBook}
              title={tTop.symbolBook[lang]}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              id="btn-theme-toggle"
              onClick={onToggleTheme}
              title={tTop.toggleTheme[lang]}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Settings */}
            <button
              type="button"
              id="btn-open-settings"
              onClick={onOpenSettings}
              title={tTop.settings[lang]}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom row: View Mode Pill Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1" aria-label="View Selection">
          {orderedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.mode;
            const label = TRANSLATIONS.tabs[tab.mode]?.[lang] || tab.mode;
            return (
              <button
                key={tab.mode}
                id={`tab-view-${tab.mode.toLowerCase()}`}
                onClick={() => onSelectView(tab.mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
