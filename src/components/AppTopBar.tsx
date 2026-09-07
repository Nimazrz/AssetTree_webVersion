import React from 'react';
import {
  DisplaySettings,
  AppLanguage,
} from '../types';
import {
  FolderTree,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { LiveDateTime } from './LiveDateTime';

interface AppTopBarProps {
  settings: DisplaySettings;
  undoCount: number;
  onTogglePrivacy: () => void;
  onUndo: () => void;
  onOpenSettings: () => void;
  // Kept optional for backward compatibility
  activeView?: string;
  onSelectView?: (view: any) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onToggleLanguage?: () => void;
  onOpenExcelImport?: () => void;
  onOpenSymbolBook?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  settings,
  undoCount,
  onTogglePrivacy,
  onUndo,
  onOpenSettings,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const tTop = TRANSLATIONS.topBar;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Brand & Action Icons */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <FolderTree className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm xs:text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {TRANSLATIONS.appTitle[lang]}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                {TRANSLATIONS.appSubtitle[lang]}
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Privacy Mode Toggle */}
            <button
              type="button"
              id="btn-privacy-toggle"
              onClick={onTogglePrivacy}
              title={settings.privacyMode ? tTop.privacyOn[lang] : tTop.privacyOff[lang]}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
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
              className={`relative p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
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

            {/* Live Date and Time (in top-left corner beside Settings icon) */}
            <LiveDateTime
              language={lang}
              usePersianDigits={settings.usePersianDigits !== false}
            />

            {/* Settings */}
            <button
              type="button"
              id="btn-open-settings"
              onClick={onOpenSettings}
              title={tTop.settings[lang]}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
